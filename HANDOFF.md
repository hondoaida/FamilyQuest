# FamilyQuest Handoff

## Pregled projekta

FamilyQuest je aplikacija za roditelje i djecu. Backend je ASP.NET Core Web API, a mobile aplikacija je Expo React Native Android app.

Glavna ideja aplikacije:
- roditelj se registruje i prijavljuje
- roditelj dodaje djecu
- roditelj dodjeljuje zadatke djetetu
- dijete kasnije završava zadatke
- roditelj odobrava ili odbija zadatak
- odobreni zadaci nose bodove
- bodovi će kasnije služiti za nagrade

## Lokacije projekata

Backend:

```text
C:\Users\aida\source\repos\FamilyQuest\FamilyQuestWebApi
```

Mobile app:

```text
C:\Users\aida\source\repos\FamilyQuest\FamilyQuestMobile
```

Napomena: u nekim alatima se pojavljivala pogrešna putanja `FamillyQuest`, ali stvarni repo koji smo koristili je `FamilyQuest`.

## Backend status

Backend koristi ASP.NET Core Web API, Entity Framework Core i SQL Server.

Implementirano:
- `UserController`
- `AuthController`
- kontroleri/servisi za zadatke, nagrade, poruke i parent-child vezu
- JWT autentifikacija
- Scalar dokumentacija sa JWT podrškom
- parent-child veza
- kreiranje djece kao `User` sa rolom `Child`
- kreiranje zadataka kroz `POST /api/tasks`
- dohvat zadataka kroz `GET /api/tasks`
- promjena statusa zadatka kroz `PUT /api/tasks/{id}/status`

Važni endpoint-i:

```text
POST /api/user
POST /api/auth/login
GET  /api/me
GET  /api/me/children
POST /api/parentchildren
GET  /api/tasks
POST /api/tasks
PUT  /api/tasks/{id}/status
```

## User i Auth

`User` sada ima:
- `Id`
- `Name`
- `Email`
- `PasswordHash`
- `Role`
- `CreatedAt`
- `IsActive`
- `AvatarKey`

`AvatarKey` se koristi za roditeljski avatar u mobile aplikaciji.

Roditeljski avatari u mobile app-u:

```text
assets/parent-item/mum-one.png
assets/parent-item/mum-two.png
assets/parent-item/mum-three.png
assets/parent-item/dad-one.png
assets/parent-item/dad-two.png
assets/parent-item/dad-three.png
```

## Task logika

Tabela/entitet `TaskItem` ima:
- `Id`
- `Name`
- `Description`
- `IconKey`
- `Points`
- `DueDate`
- `Status`
- `ChildId`

Status enum:

```csharp
Assigned = 1
PendingApproval = 2
Approved = 3
Rejected = 4
```

Trenutni tok:
1. Roditelj dodaje zadatak.
2. Mobile šalje `POST /api/tasks`.
3. Backend provjerava da je korisnik Parent/Admin.
4. Backend provjerava da dijete postoji i ima rolu `Child`.
5. Backend provjerava da je roditelj povezan sa tim djetetom.
6. Backend kreira task sa statusom `Assigned`.
7. Task se upisuje u `Tasks` tabelu.
8. Mobile prikazuje task na kartici djeteta.
9. Klik na task otvara modal.
10. Roditelj može odobriti kao završeno ili otkazati.

Primjer request-a za kreiranje zadatka:

```json
{
  "name": "Operi suđe",
  "description": null,
  "iconKey": "dishes",
  "points": 20,
  "dueDate": "2026-06-15T18:00:00.000Z",
  "status": 1,
  "childId": 5
}
```

Backend metoda koja stvarno upisuje u bazu je `CreateTaskAsync` u:

```text
FamilyQuestWebApi/Services/TaskService.cs
```

Ključni dio:

```csharp
_dbContext.Tasks.Add(task);
await _dbContext.SaveChangesAsync();
```

## EF migracije

Dodane migracije:

```text
20260614183726_AddTaskIconKey
20260614185504_AddUserAvatarKey
```

`AddTaskIconKey` dodaje `IconKey` na `Tasks`.

`AddUserAvatarKey` dodaje `AvatarKey` na `Users`.

Migracije su primijenjene na lokalnu bazu.

## Mobile app status

Mobile app je Expo React Native app.

Važni fajlovi:

```text
FamilyQuestMobile/App.js
FamilyQuestMobile/src/config/api.js
FamilyQuestMobile/src/services/authService.js
FamilyQuestMobile/src/services/childrenService.js
FamilyQuestMobile/src/services/parentChildService.js
FamilyQuestMobile/src/services/taskService.js
FamilyQuestMobile/src/screens/RegisterScreen.js
FamilyQuestMobile/src/screens/LoginScreen.js
FamilyQuestMobile/src/screens/ParentHomeScreen.js
FamilyQuestMobile/src/screens/AddChildScreen.js
FamilyQuestMobile/src/screens/ChildrenScreen.js
FamilyQuestMobile/src/components/AddTaskModal.js
FamilyQuestMobile/src/components/InputField.js
FamilyQuestMobile/src/utils/parentAvatars.js
```

## Mobile registracija

`RegisterScreen` ima UI prema dostavljenoj slici.

Implementirano:
- ime
- prezime
- izbor roditeljskog avatara
- e-mail
- lozinka
- potvrda lozinke
- uslovi lozinke
- prihvatanje uslova korištenja
- link na login

Izbor avatara je ispod polja `Prezime` i prikazan je u dva reda po tri ikonice.

Registracija šalje `avatarKey` backendu.

## Mobile login

`LoginScreen` postoji prema dostavljenoj slici.

Login poziva:

```text
POST /api/auth/login
```

Nakon login-a token i user se čuvaju u `App.js` state-u kao `authSession`.

## ParentHomeScreen

Implementirano:
- prikaz roditeljskog imena
- prikaz roditeljskog avatara iz `avatarKey`
- sekcija djece
- stvarni dohvat djece kroz `GET /api/me/children`
- klik na dijete vodi na `ChildrenScreen` sa odabranim djetetom
- dugme `Dodaj dijete`
- sekcije Zadaci, Nagrade i Poruke su djelimično statične/statističke

Sa ParentHomeScreen su uklonjena dugmad `Dodaj zadatak` i `Dodaj nagradu`, po zahtjevu.

## AddChildScreen

Implementirano:
- UI prema slici
- kreiranje djeteta kao user sa rolom `Child`
- povezivanje djeteta sa roditeljem kroz parent-child endpoint

Dijete se kreira pomoću `createChildUser`, a zatim se veza pravi preko parent-child servisa.

## ChildrenScreen

ChildrenScreen sada ima:
- pregled djece
- odabir djeteta
- prikaz bodova
- edit ikonica kod djeteta, za budući edit profil
- dugme `Dodaj zadatak`
- dugme `Dodaj nagradu`
- sekcija dodijeljenih zadataka
- sekcija predloženih nagrada

Zadaci se sada trebaju učitavati iz baze preko:

```text
GET /api/tasks
```

Task flow na mobile strani:
- `AddTaskModal` prikuplja podatke
- `taskService.createTask` šalje `POST /api/tasks`
- `ChildrenScreen` dodaje kreirani task u lokalni state
- `ChildrenScreen` filtrira taskove po `selectedChild.childId`
- klik na zadatak otvara `TaskDetailsModal`
- odobravanje/otkazivanje zove `taskService.updateTaskStatus`

Važna napomena: u toku rada bilo je nekoliko runtime grešaka zbog ostataka starog privremenog state-a:
- `setCreatedTasks` ne postoji
- `getApprovedPointsForChild` ne postoji
- `handleUpdateTaskStatus` ne postoji

Zadnje stanje: te funkcije/pozivi su popravljani, ali kod `ChildrenScreen.js` treba pažljivo testirati u emulatoru nakon reload-a jer je ekran imao više ručnih izmjena.

## Task ikone

Task ikone se nalaze u folderu:

```text
FamilyQuestMobile/assets/taskt-item
```

Napomena: folder se zove `taskt-item`, sa slovom `t` viška. Kod trenutno koristi taj naziv.

Dostupne ikone:
- `bed.png`
- `dishes.png`
- `dust.png`
- `gardening.png`
- `laundry.png`
- `notebook.png`
- `sort-dishes.png`
- `toys.png`
- `trash.png`
- `trening.png`
- `vacum.png`

`AddTaskModal` trenutno koristi dio ovih ikona.

## Poznati emulator/Expo problemi

Bilo je problema sa Android emulatorom i Expo Go.

Najčešći problemi:
- stara Expo Go verzija nije kompatibilna sa Expo SDK 54
- port `8081` zauzet starim Metro procesom
- PowerShell blokira `npx`, zato koristiti `npx.cmd`
- crni ekran se pojavio nakon prelaska na `react-native-safe-area-context`

Zaključak:
- vraćen je `SafeAreaView` iz `react-native`
- warning za deprecated `SafeAreaView` je bezopasan za sada
- prioritet je stabilno pokretanje aplikacije

Preporučena komanda za mobile start:

```powershell
cd C:\Users\aida\source\repos\FamilyQuest\FamilyQuestMobile
npx.cmd expo start -c
```

Ako emulator ne otvori app:
1. `Ctrl+C` u Expo terminalu
2. zatvoriti Expo Go na emulatoru
3. Android Studio Device Manager -> Cold Boot Now
4. ponovo pokrenuti:

```powershell
npx.cmd expo start -c
```

Ako port 8081 ostane zauzet, pronaći proces:

```powershell
Get-NetTCPConnection -LocalPort 8081
```

Zatim zaustaviti proces po `OwningProcess`:

```powershell
Stop-Process -Id <PID> -Force
```

## Pokretanje backend-a

Ako je API pokrenut i zaključava build, zaustaviti proces `FamilyQuestWebApi` ili `dotnet` koji drži exe.

Primjer clean restart:

```powershell
$processes = Get-Process dotnet,FamilyQuestWebApi -ErrorAction SilentlyContinue
if ($processes) { $processes | Stop-Process -Force }
Start-Sleep -Seconds 2

dotnet build C:\Users\aida\source\repos\FamilyQuest\FamilyQuestWebApi\FamilyQuestWebApi.csproj

Start-Process -FilePath dotnet -ArgumentList @(
  'run',
  '--project',
  'C:\Users\aida\source\repos\FamilyQuest\FamilyQuestWebApi\FamilyQuestWebApi.csproj',
  '--urls',
  'http://0.0.0.0:5213'
) -WindowStyle Hidden
```

Provjera:

```powershell
Invoke-WebRequest -Uri "http://localhost:5213/scalar/v1" -UseBasicParsing
```

Mobile app trenutno koristi API adresu za Android emulator:

```js
http://10.0.2.2:5213
```

Ovo je u:

```text
FamilyQuestMobile/src/config/api.js
```

## Git/GitHub

Kreiran je `.gitignore` ranije u toku rada.

Preporuka za slanje na GitHub:
- koristiti feature branch, npr. `feature/mobile-parent-tasks`
- provjeriti `git status`
- ne commitati `node_modules`, build output, lokalne cache fajlove

Komande:

```powershell
git status
git checkout -b feature/mobile-parent-tasks
git add .
git commit -m "Add parent task flow and mobile screens"
git push -u origin feature/mobile-parent-tasks
```

## Bitne napomene iz razgovora

Korisnica preferira objašnjenja na jednostavnom bosanskom jeziku.

Često traži da se prije implementacije objasni kako će se nešto uraditi.

Dizajn se radi prema dostavljenim slikama iz foldera:

```text
C:\Users\aida\Documents\Diplomski rad\Slike aplikacije
```

Do sada korištene slike/mockupi:
- `1. Registracija.png`
- `2. Prijava.png`
- `3. Landin page roditelj.png`
- `4. Dodaj dijete.png`
- `5. Pregled djeteta.png`
- `6. Dodaj zadatak.png`

## Sljedeći najbolji koraci

Prioritet 1: stabilizovati task flow.

Provjeriti ručno:
1. login roditelja
2. odlazak na `Moja djeca`
3. klik `Dodaj zadatak`
4. dodavanje zadatka sa ikonicom
5. potvrditi da je zadatak upisan u bazu `Tasks`
6. potvrditi da se zadatak vidi nakon reload-a aplikacije
7. klik na zadatak
8. odobriti kao završeno
9. provjeriti da se status promijeni u `Approved`
10. provjeriti da bodovi djeteta rastu samo za approved zadatke

Prioritet 2: child task flow.

Treba napraviti ekran za dijete:
- dijete vidi svoje zadatke
- dijete može označiti zadatak kao završen
- status ide na `PendingApproval`
- roditelj kasnije odobrava ili odbija

Prioritet 3: nagrade.

Nakon što zadaci i bodovi rade stabilno:
- napraviti `Dodaj nagradu`
- nagrada ima naziv, bodove/cijenu, ikonicu
- dijete može zatražiti nagradu
- roditelj odobrava ili odbija zahtjev

Prioritet 4: profil/edit djeteta.

Na `ChildrenScreen` postoji pencil ikonica kod imena djeteta, ali edit još nije implementiran.

## Tehnička upozorenja

- Ne mijenjati opet `SafeAreaView` na `react-native-safe-area-context` bez dodatnog testiranja, jer je izazvao crni ekran u emulatoru.
- Koristiti `npx.cmd`, ne `npx`, zbog PowerShell execution policy problema.
- Ako `dotnet build` padne sa locked exe greškom, vjerovatno je API već pokrenut. Zaustaviti proces pa ponoviti build.
- Ako mobile ne može do API-ja na emulatoru, provjeriti da backend sluša na `http://0.0.0.0:5213` i da mobile koristi `http://10.0.2.2:5213`.

## Kratki rezime trenutnog stanja

Backend je funkcionalno dosta kompletan za osnovni auth, user, parent-child i task flow.

Mobile ima implementirane glavne ekrane:
- registracija
- prijava
- parent home
- dodaj dijete
- pregled djece
- dodaj zadatak

Najosjetljiviji dio trenutno je `ChildrenScreen` zbog nedavnih izmjena task flow-a. Tu treba prvo napraviti ručni test i po potrebi očistiti kod.
