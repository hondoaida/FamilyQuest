using FamilyQuestWebApi.Models.Entities;
using FamilyQuestWebApi.Services;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FamilyQuestWebApi.Models.Entities.TaskStatus;

namespace FamilyQuestWebApi.Data
{
    public static class DevelopmentDataSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var dbContext = services.GetRequiredService<FamilyQuestDbContext>();
            var passwordHasher = services.GetRequiredService<IPasswordHasher>();
            var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DevelopmentDataSeeder");

            try
            {
                if (await dbContext.Users.AnyAsync())
                {
                    return;
                }

                var parent = new User
                {
                    Name = "Demo Parent",
                    Email = "parent@familyquest.test",
                    PasswordHash = passwordHasher.HashPassword("Password123!"),
                    Role = UserRole.Parent
                };

                var child = new User
                {
                    Name = "Demo Child",
                    Email = "child@familyquest.test",
                    PasswordHash = passwordHasher.HashPassword("Password123!"),
                    Role = UserRole.Child
                };

                var admin = new User
                {
                    Name = "Demo Admin",
                    Email = "admin@familyquest.test",
                    PasswordHash = passwordHasher.HashPassword("Password123!"),
                    Role = UserRole.Admin
                };

                dbContext.Users.AddRange(parent, child, admin);
                await dbContext.SaveChangesAsync();

                dbContext.ParentChildren.Add(new global::ParentChild
                {
                    ParentId = parent.Id,
                    ChildId = child.Id
                });

                dbContext.Tasks.AddRange(
                    new TaskItem
                    {
                        Name = "Clean room",
                        Description = "Make the bed and organize toys.",
                        Points = 20,
                        DueDate = DateTime.Now.AddDays(1),
                        Status = TaskStatus.Assigned,
                        ChildId = child.Id
                    },
                    new TaskItem
                    {
                        Name = "Read 20 minutes",
                        Description = "Read any book for at least 20 minutes.",
                        Points = 15,
                        DueDate = DateTime.Now.AddDays(2),
                        Status = TaskStatus.Assigned,
                        ChildId = child.Id
                    });

                dbContext.Rewards.Add(new Reward
                {
                    Name = "Movie night",
                    Description = "Pick a family movie for Friday night.",
                    RequiredPoints = 50,
                    ChildId = child.Id
                });

                dbContext.Messages.Add(new global::Message
                {
                    SenderId = parent.Id,
                    ReceiverId = child.Id,
                    Content = "Welcome to FamilyQuest!",
                    SentAt = DateTime.Now
                });

                await dbContext.SaveChangesAsync();
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Development seed data could not be created.");
            }
        }
    }
}
