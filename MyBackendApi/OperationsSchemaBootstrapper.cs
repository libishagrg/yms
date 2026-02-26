using Microsoft.EntityFrameworkCore;

public static class OperationsSchemaBootstrapper
{
    public static async Task EnsureOperationsTablesAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            IF OBJECT_ID(N'[dbo].[Areas]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Areas](
                    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Areas] PRIMARY KEY,
                    [Name] NVARCHAR(100) NOT NULL,
                    [CreatedUtc] DATETIME2 NOT NULL CONSTRAINT [DF_Areas_CreatedUtc] DEFAULT SYSUTCDATETIME()
                );
                CREATE UNIQUE INDEX [IX_Areas_Name] ON [dbo].[Areas]([Name]);
            END;

            IF OBJECT_ID(N'[dbo].[Yards]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Yards](
                    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Yards] PRIMARY KEY,
                    [AreaId] INT NOT NULL,
                    [Name] NVARCHAR(100) NOT NULL,
                    [CreatedUtc] DATETIME2 NOT NULL CONSTRAINT [DF_Yards_CreatedUtc] DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT [FK_Yards_Areas_AreaId] FOREIGN KEY ([AreaId]) REFERENCES [dbo].[Areas]([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_Yards_AreaId_Name] ON [dbo].[Yards]([AreaId], [Name]);
                CREATE INDEX [IX_Yards_AreaId] ON [dbo].[Yards]([AreaId]);
            END;

            IF OBJECT_ID(N'[dbo].[Zones]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Zones](
                    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Zones] PRIMARY KEY,
                    [YardId] INT NOT NULL,
                    [Name] NVARCHAR(100) NOT NULL,
                    [CreatedUtc] DATETIME2 NOT NULL CONSTRAINT [DF_Zones_CreatedUtc] DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT [FK_Zones_Yards_YardId] FOREIGN KEY ([YardId]) REFERENCES [dbo].[Yards]([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_Zones_YardId_Name] ON [dbo].[Zones]([YardId], [Name]);
                CREATE INDEX [IX_Zones_YardId] ON [dbo].[Zones]([YardId]);
            END;

            IF OBJECT_ID(N'[dbo].[Docks]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Docks](
                    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Docks] PRIMARY KEY,
                    [ZoneId] INT NOT NULL,
                    [Name] NVARCHAR(100) NOT NULL,
                    [CreatedUtc] DATETIME2 NOT NULL CONSTRAINT [DF_Docks_CreatedUtc] DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT [FK_Docks_Zones_ZoneId] FOREIGN KEY ([ZoneId]) REFERENCES [dbo].[Zones]([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_Docks_ZoneId_Name] ON [dbo].[Docks]([ZoneId], [Name]);
                CREATE INDEX [IX_Docks_ZoneId] ON [dbo].[Docks]([ZoneId]);
            END;

            IF OBJECT_ID(N'[dbo].[Carriers]', N'U') IS NULL
            BEGIN
                CREATE TABLE [dbo].[Carriers](
                    [Id] INT IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Carriers] PRIMARY KEY,
                    [Name] NVARCHAR(120) NOT NULL,
                    [Scac] NVARCHAR(30) NULL,
                    [ContactPerson] NVARCHAR(120) NULL,
                    [ContactPhone] NVARCHAR(40) NULL,
                    [Notes] NVARCHAR(300) NULL,
                    [IsActive] BIT NOT NULL CONSTRAINT [DF_Carriers_IsActive] DEFAULT 1,
                    [CreatedUtc] DATETIME2 NOT NULL CONSTRAINT [DF_Carriers_CreatedUtc] DEFAULT SYSUTCDATETIME(),
                    [UpdatedUtc] DATETIME2 NOT NULL CONSTRAINT [DF_Carriers_UpdatedUtc] DEFAULT SYSUTCDATETIME()
                );
                CREATE UNIQUE INDEX [IX_Carriers_Name] ON [dbo].[Carriers]([Name]);
            END;
            """);
    }
}
