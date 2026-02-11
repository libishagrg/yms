using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        const string DefaultConnection =
            "Server=127.0.0.1,1433;Database=TestDB;User Id=sa;Password=StrongPassword@123;TrustServerCertificate=True;Encrypt=False;";
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? DefaultConnection;

        builder.Services.AddCors(opt =>
        {
            opt.AddPolicy("Frontend", p =>
                p.WithOrigins("http://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials());
        });

        builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(connectionString));

        builder.Services.AddIdentity<AppUser, IdentityRole<int>>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = true;
                options.Password.RequiredLength = 9;
                options.Password.RequireDigit = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        builder.Services.AddScoped<IPasswordHasher<AppUser>, BCryptPasswordHasher>();

        builder.Services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = "yms.auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.SlidingExpiration = true;
            options.ExpireTimeSpan = TimeSpan.FromDays(7);
            options.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                },
                OnRedirectToAccessDenied = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }
            };
        });

        builder.Services.AddAuthorization();

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));
        var frontendUrl = builder.Configuration.GetValue<string>("FrontendUrl") ?? "http://localhost:5173";

        var app = builder.Build();

        app.UseSwagger();
        app.UseSwaggerUI();

        app.UseCors("Frontend");
        app.UseAuthentication();
        app.UseAuthorization();

        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var resetDb = builder.Configuration.GetValue<bool>("ResetIdentityDbOnStartup");
            if (resetDb)
            {
                await db.Database.EnsureDeletedAsync();
            }

            await db.Database.EnsureCreatedAsync();

            await IdentitySeeder.SeedAsync(scope.ServiceProvider);
        }

        app.MapPost("/register", async ([FromBody] RegisterRequest req,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole<int>> roleManager,
            IOptions<SmtpSettings> smtpOptions) =>
        {
            var email = (req.email ?? "").Trim().ToLowerInvariant();
            var username = (req.username ?? "").Trim();
            var roleName = (req.role ?? req.roleName ?? "").Trim();
            var firstName = (req.firstname ?? "").Trim();
            var lastName = (req.lastname ?? "").Trim();

            if (string.IsNullOrWhiteSpace(username))
            {
                username = email;
            }

            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(req.password) ||
                string.IsNullOrWhiteSpace(roleName))
            {
                return Results.BadRequest(new { message = "Email, password, and role are required." });
            }

            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null)
                return Results.Conflict(new { message = "Email already registered." });

            var roleKey = NormalizeRoleKey(roleName);
            var roles = await roleManager.Roles.AsNoTracking().ToListAsync();
            var role = roles.FirstOrDefault(r => NormalizeRoleKey(r.Name ?? "") == roleKey);

            if (role is null)
                return Results.BadRequest(new { message = $"Role '{roleName}' not found in Roles table." });

            var verificationCode = GenerateVerificationCode();

            var user = new AppUser
            {
                Email = email,
                UserName = username,
                FirstName = firstName,
                LastName = lastName,
                IsActive = false,
                EmailConfirmed = false,
                EmailVerificationCode = verificationCode,
                EmailVerificationExpiresUtc = DateTime.UtcNow.AddMinutes(15)
            };

            var createResult = await userManager.CreateAsync(user, req.password);
            if (!createResult.Succeeded)
            {
                var errorMessage = string.Join(" ", createResult.Errors.Select(e => e.Description));
                return Results.BadRequest(new { message = errorMessage });
            }

            var roleResult = await userManager.AddToRoleAsync(user, role.Name!);
            if (!roleResult.Succeeded)
            {
                var errorMessage = string.Join(" ", roleResult.Errors.Select(e => e.Description));
                return Results.BadRequest(new { message = errorMessage });
            }

            try
            {
                var verifyLink = BuildVerificationLink(frontendUrl, user.Email ?? "");
                await SendVerificationEmailAsync(smtpOptions.Value, user.Email ?? "", user.UserName ?? "", verificationCode, verifyLink, null);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Registration saved but email failed: {ex.Message}",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            return Results.Ok(new
            {
                message = "Registration successful. Verification email sent.",
                userId = user.Id,
                email = user.Email,
                username = user.UserName,
                roleName = role.Name ?? "Unknown",
                needsVerification = true
            });
        });

        app.MapPost("/verify-email", async ([FromBody] VerifyEmailRequest req, UserManager<AppUser> userManager) =>
        {
            var email = (req.email ?? "").Trim().ToLowerInvariant();
            var code = NormalizeVerificationCode(req.code);

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code))
                return Results.BadRequest(new { message = "Email and code are required." });

            if (code.Length != 6)
                return Results.BadRequest(new { message = "Verification code must be 6 digits." });

            var user = await userManager.FindByEmailAsync(email);
            if (user is null)
                return Results.NotFound(new { message = "Email not found." });

            if (user.EmailConfirmed)
                return Results.Ok(new { message = "Email already verified." });

            if (string.IsNullOrWhiteSpace(user.EmailVerificationCode) || user.EmailVerificationExpiresUtc is null)
                return Results.BadRequest(new { message = "No verification code found. Please request a new one." });

            if (user.EmailVerificationExpiresUtc < DateTime.UtcNow)
                return Results.BadRequest(new { message = "Verification code expired. Please request a new one." });

            if (!CodesMatch(user.EmailVerificationCode, code))
                return Results.BadRequest(new { message = "Invalid verification code." });

            user.IsActive = true;
            user.EmailConfirmed = true;
            user.EmailVerificationCode = null;
            user.EmailVerificationExpiresUtc = null;

            await userManager.UpdateAsync(user);

            return Results.Ok(new { message = "Email verified. You can now log in." });
        });

        app.MapPost("/resend-verification", async ([FromBody] ResendVerificationRequest req,
            UserManager<AppUser> userManager,
            IOptions<SmtpSettings> smtpOptions) =>
        {
            var email = (req.email ?? "").Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(email))
                return Results.BadRequest(new { message = "Email is required." });

            var user = await userManager.FindByEmailAsync(email);
            if (user is null)
                return Results.NotFound(new { message = "Email not found." });

            if (user.EmailConfirmed)
                return Results.Ok(new { message = "Email already verified." });

            var verificationCode = GenerateVerificationCode();
            user.EmailVerificationCode = verificationCode;
            user.EmailVerificationExpiresUtc = DateTime.UtcNow.AddMinutes(15);
            await userManager.UpdateAsync(user);

            try
            {
                var verifyLink = BuildVerificationLink(frontendUrl, user.Email ?? "");
                await SendVerificationEmailAsync(smtpOptions.Value, user.Email ?? "", user.UserName ?? "", verificationCode, verifyLink, null);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Email failed: {ex.Message}",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            return Results.Ok(new { message = "Verification email resent." });
        });

        app.MapPost("/login", async ([FromBody] LoginRequest req,
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager) =>
        {
            var email = (req.email ?? "").Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(req.password))
                return Results.BadRequest(new { message = "Email and password are required." });

            var user = await userManager.FindByEmailAsync(email);
            if (user is null)
                return Results.Json(new { message = "Email not found" },
                    statusCode: StatusCodes.Status404NotFound);

            if (!user.IsActive)
                return Results.Json(new { message = "Account is disabled." },
                    statusCode: StatusCodes.Status403Forbidden);

            if (!user.EmailConfirmed)
                return Results.Json(new
                {
                    message = "Please verify your email before logging in.",
                    needsVerification = true,
                    email = user.Email
                }, statusCode: StatusCodes.Status403Forbidden);

            var result = await signInManager.PasswordSignInAsync(user, req.password ?? "", req.rememberMe, false);
            if (!result.Succeeded)
                return Results.Json(new { message = "Your password is wrong" },
                    statusCode: StatusCodes.Status401Unauthorized);

            var roles = await userManager.GetRolesAsync(user);

            return Results.Ok(new
            {
                message = "Login successful",
                userId = user.Id,
                email = user.Email,
                username = user.UserName,
                roleName = roles.FirstOrDefault() ?? "Unknown"
            });
        });

        app.MapPost("/logout", async (SignInManager<AppUser> signInManager) =>
        {
            await signInManager.SignOutAsync();
            return Results.Ok(new { message = "Logged out" });
        });

        app.MapGet("/me", async (UserManager<AppUser> userManager, ClaimsPrincipal principal) =>
        {
            var user = await userManager.GetUserAsync(principal);
            if (user is null)
                return Results.Unauthorized();

            var roles = await userManager.GetRolesAsync(user);
            return Results.Ok(new
            {
                userId = user.Id,
                email = user.Email,
                username = user.UserName,
                roleName = roles.FirstOrDefault() ?? "Unknown"
            });
        }).RequireAuthorization();

        app.MapGet("/roles", async (RoleManager<IdentityRole<int>> roleManager) =>
        {
            var roles = await roleManager.Roles
                .Select(r => new { RoleID = r.Id, RoleName = r.Name })
                .ToListAsync();

            return Results.Ok(roles);
        });

        app.MapGet("/users", async (AppDbContext db) =>
        {
            var users = await db.Users.AsNoTracking().ToListAsync();
            var roles = await db.Roles.AsNoTracking().ToListAsync();
            var userRoles = await db.UserRoles.AsNoTracking().ToListAsync();

            var roleById = roles.ToDictionary(r => r.Id, r => r.Name ?? "Unknown");
            var rolesByUser = userRoles
                .GroupBy(ur => ur.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(ur => roleById.TryGetValue(ur.RoleId, out var name) ? name : "Unknown")
                          .Distinct()
                          .ToList());

            var result = users.Select(u =>
            {
                rolesByUser.TryGetValue(u.Id, out var userRoleNames);
                var roleName = userRoleNames?.FirstOrDefault() ?? "Unknown";
                var firstName = (u.FirstName ?? "").Trim();
                var lastName = (u.LastName ?? "").Trim();
                var displayName = $"{firstName} {lastName}".Trim();
                if (string.IsNullOrWhiteSpace(displayName))
                {
                    displayName = u.UserName ?? u.Email ?? "Unknown";
                }
                return new
                {
                    id = u.Id,
                    email = u.Email,
                    username = u.UserName,
                    firstName,
                    lastName,
                    displayName,
                    isActive = u.IsActive,
                    emailConfirmed = u.EmailConfirmed,
                    roleName
                };
            });

            return Results.Ok(result);
        });

        app.MapPost("/users", async ([FromBody] CreateUserRequest req,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole<int>> roleManager,
            IOptions<SmtpSettings> smtpOptions) =>
        {
            var email = (req.email ?? "").Trim().ToLowerInvariant();
            var roleName = (req.role ?? req.roleName ?? "").Trim();
            var firstName = (req.firstname ?? "").Trim();
            var lastName = (req.lastname ?? "").Trim();

            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(roleName) ||
                string.IsNullOrWhiteSpace(firstName) ||
                string.IsNullOrWhiteSpace(lastName))
            {
                return Results.BadRequest(new { message = "First name, last name, email, and role are required." });
            }

            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null)
                return Results.Conflict(new { message = "Email already registered." });

            var roleKey = NormalizeRoleKey(roleName);
            var roles = await roleManager.Roles.AsNoTracking().ToListAsync();
            var role = roles.FirstOrDefault(r => NormalizeRoleKey(r.Name ?? "") == roleKey);

            if (role is null)
                return Results.BadRequest(new { message = $"Role '{roleName}' not found in Roles table." });

            var verificationCode = GenerateVerificationCode();
            var tempPassword = GenerateTemporaryPassword();

            var user = new AppUser
            {
                Email = email,
                UserName = email,
                FirstName = firstName,
                LastName = lastName,
                IsActive = false,
                EmailConfirmed = false,
                EmailVerificationCode = verificationCode,
                EmailVerificationExpiresUtc = DateTime.UtcNow.AddMinutes(15)
            };

            var createResult = await userManager.CreateAsync(user, tempPassword);
            if (!createResult.Succeeded)
            {
                var errorMessage = string.Join(" ", createResult.Errors.Select(e => e.Description));
                return Results.BadRequest(new { message = errorMessage });
            }

            var roleResult = await userManager.AddToRoleAsync(user, role.Name!);
            if (!roleResult.Succeeded)
            {
                var errorMessage = string.Join(" ", roleResult.Errors.Select(e => e.Description));
                return Results.BadRequest(new { message = errorMessage });
            }

            try
            {
                var verifyLink = BuildVerificationLink(frontendUrl, user.Email ?? "");
                await SendVerificationEmailAsync(
                    smtpOptions.Value,
                    user.Email ?? "",
                    $"{firstName} {lastName}".Trim(),
                    verificationCode,
                    verifyLink,
                    tempPassword);
            }
            catch (Exception ex)
            {
                return Results.Problem($"User created but email failed: {ex.Message}",
                    statusCode: StatusCodes.Status500InternalServerError);
            }

            return Results.Ok(new
            {
                id = user.Id,
                email = user.Email,
                username = user.UserName,
                firstName,
                lastName,
                displayName = $"{firstName} {lastName}".Trim(),
                isActive = user.IsActive,
                emailConfirmed = user.EmailConfirmed,
                roleName = role.Name ?? "Unknown"
            });
        });

        app.MapPatch("/users/{id:int}/toggle-active", async (int id, AppDbContext db) =>
        {
            var user = await db.Users.FindAsync(id);
            if (user is null)
                return Results.NotFound(new { message = "User not found." });

            user.IsActive = !user.IsActive;
            await db.SaveChangesAsync();

            return Results.Ok(new { id = user.Id, isActive = user.IsActive });
        });

        app.MapPut("/users/{id:int}/role", async (int id, [FromBody] UpdateUserRoleRequest req,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole<int>> roleManager) =>
        {
            if (string.IsNullOrWhiteSpace(req.roleName))
                return Results.BadRequest(new { message = "Role name is required." });

            var user = await userManager.FindByIdAsync(id.ToString());
            if (user is null)
                return Results.NotFound(new { message = "User not found." });

            var role = await roleManager.FindByNameAsync(req.roleName);
            if (role is null)
                return Results.BadRequest(new { message = "Role not found." });

            var currentRoles = await userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    var errorMessage = string.Join(" ", removeResult.Errors.Select(e => e.Description));
                    return Results.Problem(errorMessage, statusCode: StatusCodes.Status500InternalServerError);
                }
            }

            var addResult = await userManager.AddToRoleAsync(user, role.Name ?? req.roleName);
            if (!addResult.Succeeded)
            {
                var errorMessage = string.Join(" ", addResult.Errors.Select(e => e.Description));
                return Results.Problem(errorMessage, statusCode: StatusCodes.Status500InternalServerError);
            }

            return Results.Ok(new { id = user.Id, roleName = role.Name ?? req.roleName });
        });

        app.MapGet("/trial", async (UserManager<AppUser> userManager) =>
        {
            var users = await userManager.Users
                .Select(u => new { u.Id, u.Email, u.UserName, u.IsActive })
                .ToListAsync();

            return Results.Ok(users);
        });

        app.Run();
    }

    private static string NormalizeRoleKey(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "";
        var cleaned = new string(value.Where(c => !char.IsWhiteSpace(c)).ToArray());
        return cleaned.ToLowerInvariant();
    }

    private static string NormalizeVerificationCode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "";
        var digits = Regex.Replace(value, "[^0-9]", "");
        return digits.Trim();
    }

    private static string GenerateVerificationCode()
    {
        var code = RandomNumberGenerator.GetInt32(0, 1000000);
        return code.ToString("D6");
    }

    private static bool CodesMatch(string storedCode, string providedCode)
    {
        if (string.IsNullOrWhiteSpace(storedCode) || string.IsNullOrWhiteSpace(providedCode))
            return false;

        var left = Encoding.UTF8.GetBytes(storedCode);
        var right = Encoding.UTF8.GetBytes(providedCode);

        if (left.Length != right.Length)
            return false;

        return CryptographicOperations.FixedTimeEquals(left, right);
    }

    private static string BuildVerificationLink(string baseUrl, string email)
    {
        var trimmed = (baseUrl ?? "").Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(trimmed))
            trimmed = "http://localhost:5173";
        return $"{trimmed}/verify-email?email={Uri.EscapeDataString(email)}";
    }

    private static string GenerateTemporaryPassword()
    {
        const string letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string digits = "0123456789";
        const string specials = "!@#$";
        const string all = letters + digits + specials;

        var length = 12;
        var chars = new List<char>(length)
        {
            letters[RandomNumberGenerator.GetInt32(letters.Length)],
            digits[RandomNumberGenerator.GetInt32(digits.Length)],
            specials[RandomNumberGenerator.GetInt32(specials.Length)]
        };

        for (var i = chars.Count; i < length; i++)
        {
            chars.Add(all[RandomNumberGenerator.GetInt32(all.Length)]);
        }

        return new string(chars.OrderBy(_ => RandomNumberGenerator.GetInt32(int.MaxValue)).ToArray());
    }

    private static async Task SendVerificationEmailAsync(
        SmtpSettings settings,
        string toEmail,
        string username,
        string code,
        string verifyLink,
        string? tempPassword)
    {
        if (string.IsNullOrWhiteSpace(settings.Host) ||
            string.IsNullOrWhiteSpace(settings.Username) ||
            string.IsNullOrWhiteSpace(settings.Password) ||
            string.IsNullOrWhiteSpace(settings.FromEmail))
        {
            throw new InvalidOperationException("SMTP settings are missing or incomplete.");
        }

        var lines = new List<string>
        {
            $"Hi {username},",
            "",
            "Your verification code is:",
            code,
            "",
            "Verify your email:",
            verifyLink,
            "",
            "This code expires in 15 minutes."
        };

        if (!string.IsNullOrWhiteSpace(tempPassword))
        {
            lines.Add("");
            lines.Add("Temporary password:");
            lines.Add(tempPassword);
            lines.Add("Please change your password after signing in.");
        }

        lines.Add("");
        lines.Add("If you didn't create this account, you can ignore this email.");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings.FromName ?? "YMS", settings.FromEmail));
        message.To.Add(new MailboxAddress(username, toEmail));
        message.Subject = "Verify your email";
        message.Body = new TextPart("plain")
        {
            Text = string.Join("\n", lines)
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(settings.Host, settings.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(settings.Username, settings.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}

public class RegisterRequest
{
    public string? email { get; init; }
    public string? username { get; init; }
    public string? password { get; init; }
    public string? role { get; init; }
    public string? roleName { get; init; }
    public string? firstname { get; init; }
    public string? lastname { get; init; }
}

public class LoginRequest
{
    public string? email { get; init; }
    public string? password { get; init; }
    public bool rememberMe { get; init; }
}

public record VerifyEmailRequest(string email, string code);
public record ResendVerificationRequest(string email);
public record UpdateUserRoleRequest(string roleName);
public class CreateUserRequest
{
    public string? firstname { get; init; }
    public string? lastname { get; init; }
    public string? email { get; init; }
    public string? role { get; init; }
    public string? roleName { get; init; }
}

public class SmtpSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string? FromName { get; set; }
}

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
}

public class AppUser : IdentityUser<int>
{
    public bool IsActive { get; set; } = false;
    [MaxLength(100)]
    public string? FirstName { get; set; }
    [MaxLength(100)]
    public string? LastName { get; set; }
    [MaxLength(12)]
    public string? EmailVerificationCode { get; set; }
    public DateTime? EmailVerificationExpiresUtc { get; set; }
}

public class BCryptPasswordHasher : IPasswordHasher<AppUser>
{
    public string HashPassword(AppUser user, string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 10);
    }

    public PasswordVerificationResult VerifyHashedPassword(AppUser user, string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrWhiteSpace(hashedPassword))
            return PasswordVerificationResult.Failed;

        var ok = BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);
        return ok ? PasswordVerificationResult.Success : PasswordVerificationResult.Failed;
    }
}

public static class IdentitySeeder
{
    private static readonly string[] DefaultRoles =
    {
        "Administrator",
        "Gate Security",
        "Yard Manager",
        "Yard Jockey",
        "View Only"
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();

        foreach (var roleName in DefaultRoles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole<int>(roleName));
            }
        }

        await NormalizeAsync(roleManager, userManager);
    }

    private static async Task NormalizeAsync(RoleManager<IdentityRole<int>> roleManager, UserManager<AppUser> userManager)
    {
        var roles = await roleManager.Roles.ToListAsync();
        foreach (var role in roles)
        {
            if (string.IsNullOrWhiteSpace(role.Name))
                continue;

            var normalized = role.Name.ToUpperInvariant();
            if (role.NormalizedName != normalized)
            {
                role.NormalizedName = normalized;
                if (string.IsNullOrWhiteSpace(role.ConcurrencyStamp))
                    role.ConcurrencyStamp = Guid.NewGuid().ToString();
                await roleManager.UpdateAsync(role);
            }
        }

        var users = await userManager.Users.ToListAsync();
        foreach (var user in users)
        {
            var dirty = false;
            if (!string.IsNullOrWhiteSpace(user.UserName))
            {
                var normalized = user.UserName.ToUpperInvariant();
                if (user.NormalizedUserName != normalized)
                {
                    user.NormalizedUserName = normalized;
                    dirty = true;
                }
            }

            if (!string.IsNullOrWhiteSpace(user.Email))
            {
                var normalized = user.Email.ToUpperInvariant();
                if (user.NormalizedEmail != normalized)
                {
                    user.NormalizedEmail = normalized;
                    dirty = true;
                }
            }

            if (string.IsNullOrWhiteSpace(user.ConcurrencyStamp))
            {
                user.ConcurrencyStamp = Guid.NewGuid().ToString();
                dirty = true;
            }

            if (string.IsNullOrWhiteSpace(user.SecurityStamp))
            {
                user.SecurityStamp = Guid.NewGuid().ToString();
                dirty = true;
            }

            if (dirty)
                await userManager.UpdateAsync(user);
        }
    }
}
