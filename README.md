# VitalLink

A React Native healthcare app built with Expo and Supabase that connects patients with their doctors.

## About

VitalLink is a mobile health platform that enables real-time communication and monitoring between patients and medical professionals. Patients can log their vitals and medications, connect with a doctor, and message them directly. Doctors can manage their patients, prescribe medications, view health data, and respond in real time.

## Features

### Patient
- Log daily vitals (heart rate, blood pressure, blood sugar, weight)
- View prescribed medications with morning / afternoon / evening schedules
- Connect with a doctor by sending a request
- Real-time messaging with your assigned doctor
- Personal profile with date of birth, weight, and height

### Doctor
- Review and accept or decline incoming patient requests
- View each patient's latest vitals, medications, and personal info
- Prescribe medications directly to accepted patients
- Real-time messaging with patients
- Patient detail overview with health status indicators

## Tech Stack

- **React Native** + **Expo** (SDK 54)
- **Supabase** — auth, database, row-level security, realtime
- **Zustand** — global state management
- **React Navigation** — stack + bottom tab navigation
- **expo-secure-store** — secure session persistence

## Project Structure

```
app/
├── src/
│   ├── components/       # Auth, MedCard, VitalCard
│   ├── lib/              # Supabase client
│   ├── screens/          # All app screens
│   ├── store/            # Zustand store (useMedStore)
│   └── types/            # TypeScript types
└── App.tsx               # Navigation & role-based routing
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Start the app:
   ```bash
   npx expo start
   ```

## Supabase Setup

The app requires the following tables in Supabase:

- `profiles` — user info (full_name, role, date_of_birth, weight, height)
- `vitals` — patient vitals linked to user_id
- `medications` — medications linked to patient_id and doctor_id
- `doctor_patient` — connection requests between patients and doctors (status: pending / active)
- `messages` — chat messages between doctor and patient with realtime enabled

All tables use Row Level Security (RLS) to ensure users can only access their own data.

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Mockup
<img width="1470" height="721" alt="Screenshot 2026-04-13 at 19 55 55" src="https://github.com/user-attachments/assets/7a77d964-13da-4ae0-8d16-7b9f6dabe365" />
<img width="1470" height="595" alt="Screenshot 2026-04-13 at 19 56 09" src="https://github.com/user-attachments/assets/9d5863a1-d027-460a-be73-9026f5d8ca3c" />
<img width="1470" height="623" alt="Screenshot 2026-04-13 at 19 56 17" src="https://github.com/user-attachments/assets/92f466a7-b791-4146-9db1-aac1296b6829" />


## License

MIT
