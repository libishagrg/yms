using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // ✅ CHANGE THIS to your SQL Server connection string
        const string DefaultConnection =
            "Server=127.0.0.1,1433;Database=TestDB;User Id=sa;Password=StrongPassword@123;TrustServerCertificate=True;Encrypt=False;";
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? DefaultConnection;

        // CORS (React)
        builder.Services.AddCors(opt =>
        {
            opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
        });

        // EF Core
        builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(connectionString));

        // SMTP settings for email verification
        builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));

        var app = builder.Build();
        app.UseCors("AllowAll");

        // Create AppUser table if missing (does not change existing Role table)
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        }

        // -------------------- ENDPOINTS --------------------

        // POST /register  (frontend sends: email, username, password, role/roleName)
        app.MapPost("/register", async ([FromBody] RegisterRequest req, AppDbContext db, IOptions<SmtpSettings> smtpOptions) =>
        {
            var email = (req.email ?? "").Trim().ToLower();
            var username = (req.username ?? "").Trim();
            var roleName = (req.role ?? req.roleName ?? "").Trim();

            if (string.IsNullOrWhiteSpace(username))
            {
                var first = (req.firstname ?? "").Trim();
                var last = (req.lastname ?? "").Trim();
                username = $"{first} {last}".Trim();
            }

            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(req.password) ||
                string.IsNullOrWhiteSpace(roleName))
            {
                return Results.BadRequest(new { message = "Email, username, password, and role are required." });
            }

            // email already exists?
            var exists = await db.AppUsers.AnyAsync(u => u.Email == email);
            if (exists)
                return Results.Conflict(new { message = "Email already registered." });

            // find roleId from Roles table (tolerate whitespace/case differences)
            var roleKey = NormalizeRoleKey(roleName);
            var roles = await db.Roles.ToListAsync();
            var role = roles.FirstOrDefault(r => NormalizeRoleKey(r.RoleName) == roleKey);
            if (role is null)
                return Results.BadRequest(new { message = $"Role '{roleName}' not found in Roles table." });

            // bcrypt hash
            var pwHashed = BCrypt.Net.BCrypt.HashPassword(req.password, workFactor: 10);

            var verificationCode = GenerateVerificationCode();
            var user = new AppUser
            {
                Email = email,
                Username = username,
                PwHashed = pwHashed,
                RoleId = role.RoleID,
                IsActive = false,
                EmailVerificationCode = verificationCode,
                EmailVerificationExpiresUtc = DateTime.UtcNow.AddMinutes(15)
            };

            db.AppUsers.Add(user);
            try
            {
                await db.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                var msg = ex.GetBaseException().Message;
                return Results.Problem($"Registration failed: {msg}", statusCode: StatusCodes.Status500InternalServerError);
            }

            try
            {
                await SendVerificationEmailAsync(smtpOptions.Value, user.Email, user.Username, verificationCode);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Registration saved but email failed: {ex.Message}", statusCode: StatusCodes.Status500InternalServerError);
            }

            return Results.Ok(new
            {
                message = "Registration successful. Verification email sent.",
                userId = user.UserId,
                email = user.Email,
                username = user.Username,
                roleId = user.RoleId,
                roleName = role.RoleName,
                needsVerification = true
            });
        });

        // POST /verify-email
        app.MapPost("/verify-email", async ([FromBody] VerifyEmailRequest req, AppDbContext db) =>
        {
            var email = (req.email ?? "").Trim().ToLower();
            var code = (req.code ?? "").Trim();

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code))
                return Results.BadRequest(new { message = "Email and code are required." });

            var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null)
                return Results.NotFound(new { message = "Email not found." });

            if (user.IsActive)
                return Results.Ok(new { message = "Email already verified." });

            if (string.IsNullOrWhiteSpace(user.EmailVerificationCode) || user.EmailVerificationExpiresUtc is null)
                return Results.BadRequest(new { message = "No verification code found. Please request a new one." });

            if (user.EmailVerificationExpiresUtc < DateTime.UtcNow)
                return Results.BadRequest(new { message = "Verification code expired. Please request a new one." });

            if (!CodesMatch(user.EmailVerificationCode, code))
                return Results.BadRequest(new { message = "Invalid verification code." });

            user.IsActive = true;
            user.EmailVerificationCode = null;
            user.EmailVerificationExpiresUtc = null;
            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Email verified. You can now log in." });
        });

        // POST /resend-verification
        app.MapPost("/resend-verification", async ([FromBody] ResendVerificationRequest req, AppDbContext db, IOptions<SmtpSettings> smtpOptions) =>
        {
            var email = (req.email ?? "").Trim().ToLower();

            if (string.IsNullOrWhiteSpace(email))
                return Results.BadRequest(new { message = "Email is required." });

            var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null)
                return Results.NotFound(new { message = "Email not found." });

            if (user.IsActive)
                return Results.Ok(new { message = "Email already verified." });

            var verificationCode = GenerateVerificationCode();
            user.EmailVerificationCode = verificationCode;
            user.EmailVerificationExpiresUtc = DateTime.UtcNow.AddMinutes(15);
            await db.SaveChangesAsync();

            try
            {
                await SendVerificationEmailAsync(smtpOptions.Value, user.Email, user.Username, verificationCode);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Email failed: {ex.Message}", statusCode: StatusCodes.Status500InternalServerError);
            }

            return Results.Ok(new { message = "Verification email resent." });
        });

        // POST /login
        app.MapPost("/login", async ([FromBody] LoginRequest req, AppDbContext db) =>
{
    var email = (req.email ?? "").Trim().ToLower();

    var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Email == email);

    if (user is null)
        return Results.Json(
            new { message = "Email not found" },
            statusCode: StatusCodes.Status404NotFound
        );

    if (!user.IsActive)
        return Results.Json(
            new { message = "Please verify your email before logging in.", needsVerification = true, email = user.Email },
            statusCode: StatusCodes.Status403Forbidden
        );

    var ok = BCrypt.Net.BCrypt.Verify(req.password ?? "", user.PwHashed);

    if (!ok)
        return Results.Json(
            new { message = "Your password is wrong" },
            statusCode: StatusCodes.Status401Unauthorized
        );

    var role = await db.Roles.FirstOrDefaultAsync(r => r.RoleID == user.RoleId);

    return Results.Ok(new
    {
        message = "Login successful",
        userId = user.UserId,
        email = user.Email,
        username = user.Username,
        roleId = user.RoleId,
        roleName = role?.RoleName ?? "Unknown"
    });
});


        // Optional: GET /roles (debug)
        app.MapGet("/roles", async (AppDbContext db) =>
        {
            var roles = await db.Roles
                .Select(r => new { r.RoleID, r.RoleName })
                .ToListAsync();

            return Results.Ok(roles);
        });

        // Optional: GET /trial (debug)
        app.MapGet("/trial", async (AppDbContext db) =>
        {
            var users = await db.AppUsers
                .Select(u => new { u.UserId, u.Email, u.Username, u.RoleId, u.IsActive })
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

    private static async Task SendVerificationEmailAsync(SmtpSettings settings, string toEmail, string username, string code)
    {
        if (string.IsNullOrWhiteSpace(settings.Host) ||
            string.IsNullOrWhiteSpace(settings.Username) ||
            string.IsNullOrWhiteSpace(settings.Password) ||
            string.IsNullOrWhiteSpace(settings.FromEmail))
        {
            throw new InvalidOperationException("SMTP settings are missing or incomplete.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(settings.FromName ?? "YMS", settings.FromEmail));
        message.To.Add(new MailboxAddress(username, toEmail));
        message.Subject = "Verify your email";
        message.Body = new TextPart("plain")
        {
            Text = $"Hi {username},\n\nYour verification code is: {code}\n\nThis code expires in 15 minutes.\n\nIf you didn't create this account, you can ignore this email."
        };

        using var client = new SmtpClient();
        await client.ConnectAsync(settings.Host, settings.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(settings.Username, settings.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}

// -------------------- DTOs --------------------
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
public record LoginRequest(string email, string password);
public record VerifyEmailRequest(string email, string code);
public record ResendVerificationRequest(string email);

public class SmtpSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string? FromName { get; set; }
}

// -------------------- EF Core --------------------
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<Role> Roles => Set<Role>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // AppUser table
        modelBuilder.Entity<AppUser>().ToTable("AppUser", "dbo");
        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Email)
            .IsUnique();
        modelBuilder.Entity<AppUser>()
            .Property(u => u.PwHashed)
            .HasColumnName("PasswordHashed");

        // ✅ Roles table mapping
        // If your actual table is "Roles" (plural), change to .ToTable("Roles")
        modelBuilder.Entity<Role>().ToTable("Roles", "dbo");

        base.OnModelCreating(modelBuilder);
    }
}

// -------------------- Models --------------------
public class AppUser
{
    [Key]
    public int UserId { get; set; }

    [Required, MaxLength(200)]
    public string Email { get; set; } = "";

    [Required, MaxLength(120)]
    public string Username { get; set; } = "";

    [Required]
    public string PwHashed { get; set; } = "";

    public int RoleId { get; set; }

    public bool IsActive { get; set; } = false;

    [MaxLength(12)]
    public string? EmailVerificationCode { get; set; }

    public DateTime? EmailVerificationExpiresUtc { get; set; }
}

public class Role
{
    [Key]
    public int RoleID { get; set; }

    [Required, MaxLength(100)]
    public string RoleName { get; set; } = "";
}
