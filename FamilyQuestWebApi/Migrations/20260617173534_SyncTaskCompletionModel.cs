using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyQuestWebApi.Migrations
{
    /// <inheritdoc />
    public partial class SyncTaskCompletionModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompletionImageDataUrl",
                table: "Tasks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "Tasks",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompletionImageDataUrl",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "Tasks");
        }
    }
}
