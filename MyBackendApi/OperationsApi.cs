using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public static class OperationsApi
{
    private const string AuthenticatedUserPolicy = "AuthenticatedUser";
    private const string ManageOperationsPolicy = "ManageOperations";

    public static void MapOperationsEndpoints(this WebApplication app)
    {
        MapLocationEndpoints(app);
        MapCarrierEndpoints(app);
    }

    private static void MapLocationEndpoints(WebApplication app)
    {
        var locations = app.MapGroup("/api/locations")
            .RequireAuthorization(AuthenticatedUserPolicy);
        var manageLocations = locations.MapGroup("")
            .RequireAuthorization(ManageOperationsPolicy);

        locations.MapGet("/tree", async (AppDbContext db) =>
        {
            var areas = await db.Areas
                .AsNoTracking()
                .Include(area => area.Yards)
                    .ThenInclude(yard => yard.Zones)
                        .ThenInclude(zone => zone.Docks)
                .ToListAsync();

            var payload = areas
                .OrderBy(area => area.Name)
                .Select(area => new AreaTreeDto(
                    area.Id,
                    area.Name,
                    area.Yards
                        .OrderBy(yard => yard.Name)
                        .Select(yard => new YardTreeDto(
                            yard.Id,
                            yard.Name,
                            yard.AreaId,
                            yard.Zones
                                .OrderBy(zone => zone.Name)
                                .Select(zone => new ZoneTreeDto(
                                    zone.Id,
                                    zone.Name,
                                    zone.YardId,
                                    zone.Docks
                                        .OrderBy(dock => dock.Name)
                                        .Select(dock => new DockTreeDto(dock.Id, dock.Name, dock.ZoneId))
                                        .ToList()))
                                .ToList()))
                        .ToList()))
                .ToList();

            return Results.Ok(payload);
        });

        manageLocations.MapPost("/areas", async ([FromBody] AreaWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Area name is required." });
            }

            var duplicateExists = await db.Areas.AnyAsync(area => area.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Area name already exists." });
            }

            var area = new Area { Name = name };
            db.Areas.Add(area);
            await db.SaveChangesAsync();

            return Results.Created($"/api/locations/areas/{area.Id}", new { area.Id, area.Name });
        });

        manageLocations.MapPut("/areas/{id:int}", async (int id, [FromBody] AreaWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Area name is required." });
            }

            var area = await db.Areas.FindAsync(id);
            if (area is null)
            {
                return Results.NotFound(new { message = "Area not found." });
            }

            var duplicateExists = await db.Areas.AnyAsync(entry => entry.Id != id && entry.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Area name already exists." });
            }

            area.Name = name;
            await db.SaveChangesAsync();

            return Results.Ok(new { area.Id, area.Name });
        });

        manageLocations.MapDelete("/areas/{id:int}", async (int id, AppDbContext db) =>
        {
            var area = await db.Areas.FindAsync(id);
            if (area is null)
            {
                return Results.NotFound(new { message = "Area not found." });
            }

            db.Areas.Remove(area);
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Area deleted." });
        });

        manageLocations.MapPost("/yards", async ([FromBody] YardWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Yard name is required." });
            }

            var parentAreaExists = await db.Areas.AnyAsync(area => area.Id == request.AreaId);
            if (!parentAreaExists)
            {
                return Results.BadRequest(new { message = "Parent area not found." });
            }

            var duplicateExists = await db.Yards.AnyAsync(yard =>
                yard.AreaId == request.AreaId && yard.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Yard name already exists in this area." });
            }

            var yard = new Yard
            {
                AreaId = request.AreaId,
                Name = name
            };

            db.Yards.Add(yard);
            await db.SaveChangesAsync();

            return Results.Created($"/api/locations/yards/{yard.Id}", new { yard.Id, yard.Name, yard.AreaId });
        });

        manageLocations.MapPut("/yards/{id:int}", async (int id, [FromBody] AreaWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Yard name is required." });
            }

            var yard = await db.Yards.FindAsync(id);
            if (yard is null)
            {
                return Results.NotFound(new { message = "Yard not found." });
            }

            var duplicateExists = await db.Yards.AnyAsync(entry =>
                entry.Id != id &&
                entry.AreaId == yard.AreaId &&
                entry.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Yard name already exists in this area." });
            }

            yard.Name = name;
            await db.SaveChangesAsync();

            return Results.Ok(new { yard.Id, yard.Name, yard.AreaId });
        });

        manageLocations.MapDelete("/yards/{id:int}", async (int id, AppDbContext db) =>
        {
            var yard = await db.Yards.FindAsync(id);
            if (yard is null)
            {
                return Results.NotFound(new { message = "Yard not found." });
            }

            db.Yards.Remove(yard);
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Yard deleted." });
        });

        manageLocations.MapPost("/zones", async ([FromBody] ZoneWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Zone name is required." });
            }

            var parentYard = await db.Yards
                .AsNoTracking()
                .FirstOrDefaultAsync(yard => yard.Id == request.YardId);
            if (parentYard is null)
            {
                return Results.BadRequest(new { message = "Parent yard not found." });
            }

            var duplicateExists = await db.Zones.AnyAsync(zone =>
                zone.YardId == request.YardId && zone.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Zone name already exists in this yard." });
            }

            var zone = new Zone
            {
                YardId = request.YardId,
                Name = name
            };

            db.Zones.Add(zone);
            await db.SaveChangesAsync();

            return Results.Created($"/api/locations/zones/{zone.Id}", new { zone.Id, zone.Name, zone.YardId });
        });

        manageLocations.MapPut("/zones/{id:int}", async (int id, [FromBody] AreaWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Zone name is required." });
            }

            var zone = await db.Zones.FindAsync(id);
            if (zone is null)
            {
                return Results.NotFound(new { message = "Zone not found." });
            }

            var duplicateExists = await db.Zones.AnyAsync(entry =>
                entry.Id != id &&
                entry.YardId == zone.YardId &&
                entry.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Zone name already exists in this yard." });
            }

            zone.Name = name;
            await db.SaveChangesAsync();

            return Results.Ok(new { zone.Id, zone.Name, zone.YardId });
        });

        manageLocations.MapDelete("/zones/{id:int}", async (int id, AppDbContext db) =>
        {
            var zone = await db.Zones.FindAsync(id);
            if (zone is null)
            {
                return Results.NotFound(new { message = "Zone not found." });
            }

            db.Zones.Remove(zone);
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Zone deleted." });
        });

        manageLocations.MapPost("/docks", async ([FromBody] DockWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Dock name is required." });
            }

            var parentZoneExists = await db.Zones.AnyAsync(zone => zone.Id == request.ZoneId);
            if (!parentZoneExists)
            {
                return Results.BadRequest(new { message = "Parent zone not found." });
            }

            var duplicateExists = await db.Docks.AnyAsync(dock =>
                dock.ZoneId == request.ZoneId && dock.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Dock name already exists in this zone." });
            }

            var dock = new Dock
            {
                ZoneId = request.ZoneId,
                Name = name
            };

            db.Docks.Add(dock);
            await db.SaveChangesAsync();

            return Results.Created($"/api/locations/docks/{dock.Id}", new { dock.Id, dock.Name, dock.ZoneId });
        });

        manageLocations.MapPut("/docks/{id:int}", async (int id, [FromBody] AreaWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Dock name is required." });
            }

            var dock = await db.Docks.FindAsync(id);
            if (dock is null)
            {
                return Results.NotFound(new { message = "Dock not found." });
            }

            var duplicateExists = await db.Docks.AnyAsync(entry =>
                entry.Id != id &&
                entry.ZoneId == dock.ZoneId &&
                entry.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Dock name already exists in this zone." });
            }

            dock.Name = name;
            await db.SaveChangesAsync();

            return Results.Ok(new { dock.Id, dock.Name, dock.ZoneId });
        });

        manageLocations.MapDelete("/docks/{id:int}", async (int id, AppDbContext db) =>
        {
            var dock = await db.Docks.FindAsync(id);
            if (dock is null)
            {
                return Results.NotFound(new { message = "Dock not found." });
            }

            db.Docks.Remove(dock);
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Dock deleted." });
        });
    }

    private static void MapCarrierEndpoints(WebApplication app)
    {
        var carriers = app.MapGroup("/api/carriers")
            .RequireAuthorization(AuthenticatedUserPolicy);
        var manageCarriers = carriers.MapGroup("")
            .RequireAuthorization(ManageOperationsPolicy);

        carriers.MapGet("", async (AppDbContext db) =>
        {
            var carrierList = await db.Carriers
                .AsNoTracking()
                .OrderBy(carrier => carrier.Name)
                .Select(carrier => new
                {
                    carrier.Id,
                    carrier.Name,
                    carrier.Scac,
                    carrier.ContactPerson,
                    carrier.ContactPhone,
                    carrier.Notes,
                    carrier.IsActive
                })
                .ToListAsync();

            return Results.Ok(carrierList);
        });

        manageCarriers.MapPost("", async ([FromBody] CarrierWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Carrier name is required." });
            }

            var duplicateExists = await db.Carriers.AnyAsync(carrier => carrier.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Carrier name already exists." });
            }

            var now = DateTime.UtcNow;
            var carrier = new Carrier
            {
                Name = name,
                Scac = NormalizeOptionalValue(request.Scac, 30),
                ContactPerson = NormalizeOptionalValue(request.ContactPerson, 120),
                ContactPhone = NormalizeOptionalValue(request.ContactPhone, 40),
                Notes = NormalizeOptionalValue(request.Notes, 300),
                IsActive = request.IsActive,
                CreatedUtc = now,
                UpdatedUtc = now
            };

            db.Carriers.Add(carrier);
            await db.SaveChangesAsync();

            return Results.Created($"/api/carriers/{carrier.Id}", new
            {
                carrier.Id,
                carrier.Name,
                carrier.Scac,
                carrier.ContactPerson,
                carrier.ContactPhone,
                carrier.Notes,
                carrier.IsActive
            });
        });

        manageCarriers.MapPut("/{id:int}", async (int id, [FromBody] CarrierWriteRequest request, AppDbContext db) =>
        {
            var name = NormalizeRequiredName(request.Name);
            if (name is null)
            {
                return Results.BadRequest(new { message = "Carrier name is required." });
            }

            var carrier = await db.Carriers.FindAsync(id);
            if (carrier is null)
            {
                return Results.NotFound(new { message = "Carrier not found." });
            }

            var duplicateExists = await db.Carriers.AnyAsync(entry => entry.Id != id && entry.Name == name);
            if (duplicateExists)
            {
                return Results.Conflict(new { message = "Carrier name already exists." });
            }

            carrier.Name = name;
            carrier.Scac = NormalizeOptionalValue(request.Scac, 30);
            carrier.ContactPerson = NormalizeOptionalValue(request.ContactPerson, 120);
            carrier.ContactPhone = NormalizeOptionalValue(request.ContactPhone, 40);
            carrier.Notes = NormalizeOptionalValue(request.Notes, 300);
            carrier.IsActive = request.IsActive;
            carrier.UpdatedUtc = DateTime.UtcNow;

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                carrier.Id,
                carrier.Name,
                carrier.Scac,
                carrier.ContactPerson,
                carrier.ContactPhone,
                carrier.Notes,
                carrier.IsActive
            });
        });

        manageCarriers.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var carrier = await db.Carriers.FindAsync(id);
            if (carrier is null)
            {
                return Results.NotFound(new { message = "Carrier not found." });
            }

            db.Carriers.Remove(carrier);
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Carrier deleted." });
        });
    }

    private static string? NormalizeRequiredName(string? value)
    {
        var normalized = (value ?? "").Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string? NormalizeOptionalValue(string? value, int maxLength)
    {
        var normalized = (value ?? "").Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        return normalized.Length <= maxLength
            ? normalized
            : normalized[..maxLength];
    }
}
