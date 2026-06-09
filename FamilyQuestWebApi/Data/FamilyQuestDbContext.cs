using FamilyQuestWebApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyQuestWebApi.Data
{
    public class FamilyQuestDbContext : DbContext
    {
        public FamilyQuestDbContext(DbContextOptions<FamilyQuestDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<TaskItem> Tasks { get; set; }

        public DbSet<Reward> Rewards { get; set; }
        public DbSet<ParentChild> ParentChildren { get; set; }

        public DbSet<RewardRequest> RewardRequests { get; set; }

        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ParentChild>()
                .HasOne(pc => pc.Parent)
                .WithMany()
                .HasForeignKey(pc => pc.ParentId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ParentChild>()
                .HasOne(pc => pc.Child)
                .WithMany()
                .HasForeignKey(pc => pc.ChildId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<RewardRequest>()
    .HasOne(rr => rr.Child)
    .WithMany()
    .HasForeignKey(rr => rr.ChildId)
    .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<RewardRequest>()
                .HasOne(rr => rr.Reward)
                .WithMany()
                .HasForeignKey(rr => rr.RewardId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }


}

