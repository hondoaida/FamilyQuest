using System.Security.Cryptography;

namespace FamilyQuestWebApi.Services
{
    public class PasswordHasher : IPasswordHasher
    {
        private const int PasswordHashIterations = 100000;
        private const int PasswordSaltSize = 16;
        private const int PasswordHashSize = 32;

        public string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(PasswordSaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                PasswordHashIterations,
                HashAlgorithmName.SHA256,
                PasswordHashSize);

            return $"PBKDF2${PasswordHashIterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public bool VerifyPassword(string password, string passwordHash)
        {
            var parts = passwordHash.Split('$');

            if (parts.Length != 4 || parts[0] != "PBKDF2")
            {
                return false;
            }

            if (!int.TryParse(parts[1], out var iterations))
            {
                return false;
            }

            try
            {
                var salt = Convert.FromBase64String(parts[2]);
                var expectedHash = Convert.FromBase64String(parts[3]);
                var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256,
                    expectedHash.Length);

                return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }
}
