using System.ComponentModel.DataAnnotations;

public class Area
{
    public int Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = "";

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Yard> Yards { get; set; } = new List<Yard>();
}

public class Yard
{
    public int Id { get; set; }
    public int AreaId { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = "";

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    public Area? Area { get; set; }
    public ICollection<Zone> Zones { get; set; } = new List<Zone>();
}

public class Zone
{
    public int Id { get; set; }
    public int YardId { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = "";

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    public Yard? Yard { get; set; }
    public ICollection<Dock> Docks { get; set; } = new List<Dock>();
}

public class Dock
{
    public int Id { get; set; }
    public int ZoneId { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = "";

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    public Zone? Zone { get; set; }
}

public class Carrier
{
    public int Id { get; set; }

    [MaxLength(120)]
    public string Name { get; set; } = "";

    [MaxLength(30)]
    public string? Scac { get; set; }

    [MaxLength(120)]
    public string? ContactPerson { get; set; }

    [MaxLength(40)]
    public string? ContactPhone { get; set; }

    [MaxLength(300)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;
}

public record AreaTreeDto(int Id, string Name, IReadOnlyList<YardTreeDto> Yards);
public record YardTreeDto(int Id, string Name, int AreaId, IReadOnlyList<ZoneTreeDto> Zones);
public record ZoneTreeDto(int Id, string Name, int YardId, IReadOnlyList<DockTreeDto> Docks);
public record DockTreeDto(int Id, string Name, int ZoneId);

public record AreaWriteRequest(string? Name);
public record YardWriteRequest(string? Name, int AreaId);
public record ZoneWriteRequest(string? Name, int YardId);
public record DockWriteRequest(string? Name, int ZoneId);

public record CarrierWriteRequest(
    string? Name,
    string? Scac,
    string? ContactPerson,
    string? ContactPhone,
    string? Notes,
    bool IsActive);
