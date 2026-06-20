using FamilyQuestWebApi.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyQuestWebApi.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(FamilyQuestDbContext))]
    [Migration("20260616000100_AddRewardIconKeyDueDate")]
    public partial class AddRewardIconKeyDueDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IconKey",
                table: "Rewards",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "gamepad");

            migrationBuilder.AddColumn<DateTime>(
                name: "DueDate",
                table: "Rewards",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IconKey",
                table: "Rewards");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Rewards");
        }
    }
}
