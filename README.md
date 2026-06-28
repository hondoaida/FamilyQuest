# FamilyQuest

FamilyQuest je mobilna aplikacija koja roditeljima omogućava da djeci dodjeljuju zadatke, prate bodove i nagrade, odobravaju izvršene zadatke te razmjenjuju poruke s djecom. Projekt se sastoji od Expo React Native aplikacije i ASP.NET Core Web API-ja sa SQL Server bazom.

## Tehnologije

| Dio | Tehnologije |
| --- | --- |
| Mobile | Expo SDK 54, React 19, React Native 0.81 |
| Backend | ASP.NET Core Web API (.NET 10), Entity Framework Core |
| Baza | Microsoft SQL Server / SQL Server Express |
| Autentifikacija | JWT bearer token |
| API dokumentacija | Scalar (`/scalar/v1`) |

## Struktura

```text
FamilyQuest/
├── FamilyQuestMobile/       # Expo React Native aplikacija
│   ├── App.js               # upravlja prijavom i glavnom navigacijom
│   ├── src/screens/         # ekrani aplikacije
│   ├── src/services/        # pozivi prema API-ju
│   ├── src/config/api.js    # adresa backend API-ja
│   └── assets/              # avatari, ikone, font i ilustracije
├── FamilyQuestWebApi/       # ASP.NET Core Web API
│   ├── Controllers/         # HTTP endpoint-i
│   ├── Services/            # poslovna logika
│   ├── Models/Entities/     # EF Core entiteti
│   ├── Data/                # DbContext i razvojno seedanje podataka
│   └── Migrations/          # EF Core migracije
├── FamilyQuest.slnx
└── README.md
```

## Funkcionalnosti

### Roditelj

- registracija, prijava i izmjena profila/avatara
- dodavanje i pregled djece
- kreiranje, izmjena i praćenje zadataka
- pregled stvarne zbirne statistike djece, zadataka i nagrada
- odobravanje ili odbijanje zadatka nakon što dijete pošalje fotografiju
- kreiranje, izmjena, aktiviranje i deaktiviranje nagrada
- pregled, izmjena i odobravanje prijedloga nagrada koje šalju djeca
- notifikacije za zadatke, prijedloge nagrada, zahtjeve za nagradu i poruke
- razgovori sa svakim djetetom posebno

### Dijete

- prijava vlastitim računom
- početni ekran s bodovima, zadacima, nagradama i napretkom
- pregled samo aktivnih zadataka te slanje fotografije kao dokaza izvršenja
- ponovno slanje zadatka nakon roditeljskog odbijanja
- pregled nagrada i slanje prijedloga nagrade
- profil s avatarom, ukupnim bodovima, zadacima i osvojenim nagradama
- notifikacije i poruke s roditeljem

## Pokretanje lokalno

### Preduvjeti

- Node.js (uključuje `npm` i `npx`)
- .NET SDK 10
- SQL Server Express ili SQL Server Developer
- Android Studio sa Android emulatorom, za Android testiranje

Ako PowerShell blokira `npm` ili `npx` zbog execution policy-ja, koristi ekstenzije `.cmd`, na primjer `npx.cmd expo start`.

### 1. Baza i backend

Provjeri konekcioni string u [appsettings.json](C:/repos/FamilyQuest/FamilyQuestWebApi/appsettings.json). Lokalna razvojna konfiguracija očekuje SQL Server Express instancu i bazu `FamilyQuestDb`.

Iz korijena projekta pokreni:

```powershell
dotnet ef database update --project .\FamilyQuestWebApi\FamilyQuestWebApi.csproj
dotnet run --project .\FamilyQuestWebApi\FamilyQuestWebApi.csproj
```

U razvojnom okruženju API automatski primjenjuje migracije i može dodati razvojne podatke. Standardna HTTP adresa je:

```text
http://localhost:5213
```

Za pregled API dokumentacije otvori:

```text
http://localhost:5213/scalar/v1
```

### 2. Mobile aplikacija

U novom terminalu:

```powershell
cd .\FamilyQuestMobile
npm install
npx.cmd expo start -c
```

Kada se Expo pokrene, pritisni `a` u Expo terminalu za otvaranje Android emulatora. Možeš i direktno koristiti:

```powershell
npm run android
```

Za Android emulator mobile aplikacija koristi adresu `http://10.0.2.2:5213`, koja predstavlja `localhost` računara domaćina. Ta postavka je u [api.js](C:/repos/FamilyQuest/FamilyQuestMobile/src/config/api.js).

## Baza i migracije

Glavni `FamilyQuestDbContext` sadrži tabele:

- `Users`
- `ParentChildren`
- `Tasks`
- `Rewards`
- `RewardRequests`
- `RewardSuggestions`
- `Messages`

Kada se promijeni EF Core model, napravi i primijeni novu migraciju:

```powershell
dotnet ef migrations add OpisPromjene --project .\FamilyQuestWebApi\FamilyQuestWebApi.csproj
dotnet ef database update --project .\FamilyQuestWebApi\FamilyQuestWebApi.csproj
```

Ne preskakati migraciju: EF Core će prijaviti `PendingModelChangesWarning` ako se model promijeni bez nje.

## API pregled

Svi endpoint-i, modeli zahtjeva i autorizacija dostupni su u Scalar dokumentaciji. Najvažnije rute su:

| Ruta | Namjena |
| --- | --- |
| `POST /api/user` | registracija korisnika/djeteta |
| `POST /api/auth/login` | prijava i dobivanje JWT tokena |
| `GET /api/me` | trenutni prijavljeni korisnik |
| `GET /api/me/children` | djeca trenutnog roditelja |
| `GET, POST /api/tasks` | pregled i kreiranje zadataka |
| `PUT /api/tasks/{id}/status` | promjena statusa zadatka |
| `GET, POST, PUT /api/rewards` | pregled, kreiranje i izmjena nagrada |
| `GET, POST, PUT /api/rewardrequests` | zahtjevi za nagrade |
| `GET, PUT /api/rewardsuggestions` | prijedlozi nagrada djece |
| `GET, POST /api/messages` | poruke roditelja i djece |
| `GET, POST /api/parentchildren` | veze roditelj-dijete |

Većina endpoint-a zahtijeva JWT. U Scalaru prvo pozovi login, zatim zalijepi vraćeni token u Bearer autorizaciju.

## Statusi poslovne logike

Tok zadatka:

```text
Assigned → PendingApproval → Approved
                          └→ Rejected → dijete može poslati zadatak ponovo
```

Samo roditeljski odobren zadatak dodjeljuje bodove djetetu. Bodovi se zatim koriste za procjenu koje su nagrade ostvarive.

## Važni fajlovi

| Fajl | Svrha |
| --- | --- |
| [App.js](C:/repos/FamilyQuest/FamilyQuestMobile/App.js) | odabir glavnog ekrana prema ulozi prijavljenog korisnika |
| [ParentHomeScreen.js](C:/repos/FamilyQuest/FamilyQuestMobile/src/screens/ParentHomeScreen.js) | roditeljski dashboard, statistika i notifikacije |
| [ChildHomeScreen.js](C:/repos/FamilyQuest/FamilyQuestMobile/src/screens/ChildHomeScreen.js) | dječiji dashboard, zadaci, nagrade i profil |
| [ChildrenScreen.js](C:/repos/FamilyQuest/FamilyQuestMobile/src/screens/ChildrenScreen.js) | pregled djece i roditeljsko upravljanje zadacima/nagradama |
| [api.js](C:/repos/FamilyQuest/FamilyQuestMobile/src/config/api.js) | osnovna URL adresa API-ja |
| [FamilyQuestDbContext.cs](C:/repos/FamilyQuest/FamilyQuestWebApi/Data/FamilyQuestDbContext.cs) | EF Core model i veze tabela |
| [Program.cs](C:/repos/FamilyQuest/FamilyQuestWebApi/Program.cs) | konfiguracija API-ja, JWT-a, EF Core-a i Scalar-a |

## Rješavanje čestih problema

### `Network request failed` u Android emulatoru

1. Provjeri da API radi na `http://localhost:5213/scalar/v1`.
2. Provjeri da je `API_BASE_URL` postavljen na `http://10.0.2.2:5213`.
3. Ponovo pokreni Expo sa `npx.cmd expo start -c`.

### `adb is not recognized`

Pokreni ADB punom putanjom ili dodaj Android SDK `platform-tools` u Windows `PATH`. Primjer:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

### Emulator je `offline`

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" kill-server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" start-server
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

Ako se i dalje prikazuje kao offline, u Android Studio Device Manageru koristi `Cold Boot Now`.

### SQL Server Express ne radi

Provjeri da servis `SQL Server (SQLEXPRESS)` radi i da konekcioni string odgovara nazivu instance. Nakon promjene modela uvijek napravi EF migraciju prije `database update`.

## Razvojne napomene

- Slike i avatari se biraju lokalno iz `FamilyQuestMobile/assets`.
- U mobilnoj aplikaciji je dodat prilagođeni font `assets/fonts/familyquest-rounded.ttf`, koji podržava slova č, ć, đ, š i ž.
- Ne commitati `node_modules`, build izlaze, lokalne cache direktorije ili stvarne produkcijske tajne.
- Prije objave mijenjati razvojni JWT ključ i iznijeti osjetljivu konfiguraciju u user secrets ili environment varijable.
