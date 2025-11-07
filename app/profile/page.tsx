// app/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import ClientProfile from "@/components/ClientProfile";
import ProfileSelections from "@/components/ProfileSelections";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <main>
        <h1>Profil</h1>
        <p>Vous devez être connecté pour gérer vos personnages.</p>
      </main>
    );
  }
  return (
    <main>
      <h1>Mon profil</h1>
      <p>Gérez vos personnages et vos inscriptions de quêtes.</p>

      <ClientProfile />

      <h2 style={{ marginTop: 24 }}>Mes inscriptions</h2>
      <ProfileSelections />
    </main>
  );
}
