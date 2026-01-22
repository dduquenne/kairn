import type { AdminUser } from "../types";

type UsersTableProps = {
  users: AdminUser[];
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
};

export function UsersTable({ users, onEdit, onDelete, onResetPassword }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-night/40 bg-night/60 p-6 text-center text-ivory/70">
        Aucun utilisateur administrateur pour le moment.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-night/40 bg-night/60">
      <table className="min-w-full divide-y divide-night/40">
        <thead className="bg-night/70 text-left text-xs uppercase tracking-[0.2em] text-gold">
          <tr>
            <th scope="col" className="px-6 py-3">
              Email
            </th>
            <th scope="col" className="px-6 py-3">
              Créé le
            </th>
            <th scope="col" className="px-6 py-3">
              Mis à jour
            </th>
            <th scope="col" className="px-6 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-night/40 text-sm text-ivory/80">
          {users.map((user) => {
            const createdAt = new Date(user.createdAt).toLocaleDateString("fr-FR");
            const updatedAt = new Date(user.updatedAt).toLocaleDateString("fr-FR");
            return (
              <tr key={user.id} className="hover:bg-night/50">
                <td className="px-6 py-4 font-medium text-ivory">{user.email}</td>
                <td className="px-6 py-4">{createdAt}</td>
                <td className="px-6 py-4">{updatedAt}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onResetPassword(user)}
                      className="rounded-md border border-gold/40 px-3 py-1 text-xs font-semibold text-gold transition hover:border-gold/80 hover:text-gold"
                    >
                      Réinitialiser
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="rounded-md border border-night/40 px-3 py-1 text-xs font-semibold text-ivory/80 transition hover:border-night/60 hover:text-ivory"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      className="rounded-md border border-rose-500/50 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
