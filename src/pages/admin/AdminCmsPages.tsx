import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/app-toast";
import { FileText, Save, Plus, Trash2, Eye, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminCmsPages = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const { data: pages = [] } = useQuery({
    queryKey: ["admin-cms-pages"],
    queryFn: async () => {
      const { data } = await supabase.from("cms_pages").select("*").order("created_at");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (page: any) => {
      const { error } = await supabase.from("cms_pages").update({
        title: page.title,
        content: page.content,
        is_published: page.is_published,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        updated_at: new Date().toISOString(),
      }).eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Page saved!");
      qc.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    },
  });

  const createPage = async () => {
    if (!newSlug.trim() || !newTitle.trim()) return;
    const { error } = await supabase.from("cms_pages").insert({
      slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      title: newTitle,
      content: `# ${newTitle}\n\nContent here...`,
    });
    if (error) { toast.error(error.message); return; }
    setCreating(false);
    setNewSlug("");
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    toast.success("Page created!");
  };

  const deletePage = async (id: string) => {
    await supabase.from("cms_pages").delete().eq("id", id);
    if (selected?.id === id) setSelected(null);
    qc.invalidateQueries({ queryKey: ["admin-cms-pages"] });
    toast.success("Page deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">CMS Pages</h1>
        <Button onClick={() => setCreating(true)} className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> New Page
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Page list */}
        <div className="border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border bg-secondary/30">
            <p className="text-sm font-medium text-foreground">Pages</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {pages.map((page: any) => (
              <button
                key={page.id}
                onClick={() => setSelected({ ...page })}
                className={`w-full text-left p-3 border-b border-border hover:bg-secondary/30 transition-colors ${selected?.id === page.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{page.title}</span>
                  </div>
                  <Badge variant={page.is_published ? "default" : "secondary"} className="text-[10px]">
                    {page.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">/{page.slug}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 border border-border rounded-2xl overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a page to edit</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">Editing: {selected.title}</p>
                  <a href={`/page/${selected.slug}`} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Preview
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="destructive" onClick={() => deletePage(selected.id)} className="rounded-xl gap-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" onClick={() => saveMutation.mutate(selected)} disabled={saveMutation.isPending} className="rounded-xl gap-1">
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Slug (URL)</Label>
                    <Input value={selected.slug} disabled className="rounded-xl opacity-60" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={selected.is_published} onCheckedChange={(v) => setSelected({ ...selected, is_published: v })} />
                  <span className="text-sm text-muted-foreground">Published</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Content (Markdown)</Label>
                  <Textarea
                    value={selected.content}
                    onChange={(e) => setSelected({ ...selected, content: e.target.value })}
                    className="min-h-[400px] rounded-xl font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Meta Title</Label>
                    <Input value={selected.meta_title || ""} onChange={(e) => setSelected({ ...selected, meta_title: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Meta Description</Label>
                    <Input value={selected.meta_description || ""} onChange={(e) => setSelected({ ...selected, meta_description: e.target.value })} className="rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Page</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Page title" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL path)</Label>
              <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="page-slug" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createPage}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCmsPages;
