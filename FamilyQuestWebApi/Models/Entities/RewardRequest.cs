using FamilyQuestWebApi.Models.Entities;
using System.ComponentModel.DataAnnotations;

public class RewardRequest
{
    [Key]
    public int Id { get; set; }

    public int RewardId { get; set; }

    public Reward Reward { get; set; } = null!;

    public int ChildId { get; set; }

    public User Child { get; set; } = null!;

    public RewardRequestStatus Status { get; set; }

    public DateTime RequestDate { get; set; } = DateTime.Now;
}
