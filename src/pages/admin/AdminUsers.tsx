import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FilterChips from "@/components/admin/FilterChips";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/app-toast";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const AdminUsers = () => {
  const qc = useQueryClient();
  const [filterRole, setFilterRole] = useState("all");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error: delError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delError) throw delError;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-user-roles"] }); toast.success("Role updated"); },
    onError: (e) => toast.error(e.message),
  });

  const getUserRole = (userId: string) => roles.find((r) => r.user_id === userId)?.role ?? "user";

  const roleCounts = profiles.reduce<Record<string, number>>((acc, p) => {
    const role = getUserRole(p.id);
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const filtered = filterRole === "all" ? profiles : profiles.filter((p) => getUserRole(p.id) === filterRole);

  const filterOptions = [
    { value: "all", label: "All", count: profiles.length },
    { value: "user", label: "User", count: roleCounts["user"] || 0 },
    { value: "moderator", label: "Moderator", count: roleCounts["moderator"] || 0 },
    { value: "admin", label: "Admin", count: roleCounts["admin"] || 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Users</h1>

      <FilterChips options={filterOptions} value={filterRole} onChange={setFilterRole} />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell>{p.phone || "—"}</TableCell>
                <TableCell>{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Select value={getUserRole(p.id)} onValueChange={(v) => updateRole.mutate({ userId: p.id, role: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
