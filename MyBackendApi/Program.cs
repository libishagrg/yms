using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.ComponentModel.DataAnnotations;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // ✅ CHANGE THIS to your SQL Server connection string
        const string DefaultConnection =
            "Server=127.0.0.1,1433;Database=TestDB;User Id=sa;Password=StrongPassword@123;TrustServerCertificate=True;Encrypt=False;";

        // CORS (React)
        builder.Services.AddCors(opt =>
        {
            opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
        });

        // EF Core
        builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(DefaultConnection));

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
        app.MapPost("/register", async ([FromBody] RegisterRequest req, AppDbContext db) =>
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

            var user = new AppUser
            {
                Email = email,
                Username = username,
                PwHashed = pwHashed,
                RoleId = role.RoleID
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

            return Results.Ok(new
            {
                message = "Registration successful",
                userId = user.UserId,
                email = user.Email,
                username = user.Username,
                roleId = user.RoleId,
                roleName = role.RoleName
            });
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
                .Select(u => new { u.UserId, u.Email, u.Username, u.RoleId })
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
}

public class Role
{
    [Key]
    public int RoleID { get; set; }

    [Required, MaxLength(100)]
    public string RoleName { get; set; } = "";
}
