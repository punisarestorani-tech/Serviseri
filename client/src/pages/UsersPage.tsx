import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, UserPlus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  userRole?: string;
  organizationId?: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    userRole: "technician",
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ description: "Korisnik uspješno kreiran" });
      resetForm();
      setIsAddUserOpen(false);
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Greška pri kreiranju korisnika",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ description: "Korisnik uspješno ažuriran" });
      resetForm();
      setIsEditUserOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Greška pri ažuriranju korisnika",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ description: "Korisnik uspješno obrisan" });
      setDeleteUserId(null);
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Greška pri brisanju korisnika",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      userRole: "technician",
    });
  };

  const handleAddUser = () => {
    createUserMutation.mutate(formData);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    const updateData: any = {
      fullName: formData.fullName,
      email: formData.email,
      userRole: formData.userRole,
    };

    // Only include password if it was changed
    if (formData.password) {
      updateData.password = formData.password;
    }

    updateUserMutation.mutate({ id: selectedUser.id, data: updateData });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: "",
      fullName: user.fullName,
      email: user.email || "",
      userRole: user.userRole || "technician",
    });
    setIsEditUserOpen(true);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "org_admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "org_admin":
        return "Admin";
      default:
        return "Tehničar";
    }
  };

  const isSuperAdmin = currentUser?.userRole === "super_admin";

  return (
    <AppLayout title="Korisnici">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Korisnici</h2>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Dodaj korisnika
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novi korisnik</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Korisničko ime *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Unesite korisničko ime"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Lozinka *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Unesite lozinku"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Puno ime *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Unesite puno ime"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Unesite email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Uloga</Label>
                  <Select
                    value={formData.userRole}
                    onValueChange={(value) =>
                      setFormData({ ...formData, userRole: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite ulogu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">Tehničar</SelectItem>
                      <SelectItem value="org_admin">Admin</SelectItem>
                      {isSuperAdmin && (
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddUser}
                  className="w-full"
                  disabled={
                    !formData.username ||
                    !formData.password ||
                    !formData.fullName ||
                    createUserMutation.isPending
                  }
                >
                  {createUserMutation.isPending ? "Kreiranje..." : "Kreiraj korisnika"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži korisnike..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Učitavanje...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "Nema rezultata pretrage" : "Nema korisnika"}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime</TableHead>
                  <TableHead>Korisničko ime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Uloga</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.userRole)}>
                        {getRoleLabel(user.userRole)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUserId(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Uredi korisnika</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Korisničko ime</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova lozinka (ostavite prazno za zadržavanje)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Unesite novu lozinku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Puno ime *</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Unesite puno ime"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Unesite email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-userRole">Uloga</Label>
                <Select
                  value={formData.userRole}
                  onValueChange={(value) =>
                    setFormData({ ...formData, userRole: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Odaberite ulogu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Tehničar</SelectItem>
                    <SelectItem value="org_admin">Admin</SelectItem>
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleEditUser}
                className="w-full"
                disabled={!formData.fullName || updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Spremanje..." : "Spremi promjene"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteUserId}
          onOpenChange={() => setDeleteUserId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Obriši korisnika?</AlertDialogTitle>
              <AlertDialogDescription>
                Ova akcija se ne može poništiti. Korisnik će biti trajno obrisan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Odustani</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUserMutation.isPending ? "Brisanje..." : "Obriši"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
