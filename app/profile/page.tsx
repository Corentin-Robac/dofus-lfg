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
        <div className="screen">
          <div>
            <h1>Profil</h1>
            <p>Vous devez être connecté pour gérer vos personnages.</p>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main>
      <div className="screen">
        <div className="col-left">
          <h1>Mon profil</h1>
          <ClientProfile />
        </div>
        <div className="col-right">
          <div className="panel-right">
            <ProfileSelections />
          </div>
        </div>
      </div>
    </main>
  );
}
