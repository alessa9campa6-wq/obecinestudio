import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { api, Item, Project } from "@/src/api";

export function useProject(id: string) {
  return useQuery({ queryKey: ["project", id], queryFn: () => api<Project>(`/projects/${id}`) });
}

export function useSummary(id: string) {
  return useQuery({ queryKey: ["summary", id], queryFn: () => api<Record<string, number>>(`/projects/${id}/summary`) });
}

export function useItems(pid: string, module: string) {
  return useQuery({ queryKey: ["items", pid, module], queryFn: () => api<Item[]>(`/projects/${pid}/items?module=${module}`) });
}

export function useAllItems(pid: string) {
  return useQuery({ queryKey: ["items", pid, "__all"], queryFn: () => api<Item[]>(`/projects/${pid}/items`) });
}

// id -> item for every item in the project, used to show linked titles across modules.
export function useLookup(pid: string) {
  const q = useAllItems(pid);
  return useMemo(() => new Map((q.data ?? []).map((i) => [i.id, i])), [q.data]);
}

export function useInvalidateProject(pid: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["items", pid] });
    qc.invalidateQueries({ queryKey: ["summary", pid] });
  };
}

export function useItemMutations(pid: string, module: string) {
  const invalidate = useInvalidateProject(pid);
  const create = useMutation({
    mutationFn: (body: { title: string; data: Record<string, any>; module?: string }) =>
      api<Item>(`/projects/${pid}/items`, { method: "POST", body: { module, ...body } }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; data?: Record<string, any>; order?: number }) =>
      api<Item>(`/items/${id}`, { method: "PUT", body }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/items/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

export type LibItem = { id: string; kind: string; title: string; data: Record<string, any>; created_at: string };

export function useLibrary(kind: string) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["library", kind], queryFn: () => api<LibItem[]>(`/library?kind=${kind}`) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["library", kind] });
  const create = useMutation({
    mutationFn: (items: { title: string; data: Record<string, any> }[]) => api(`/library/bulk`, { method: "POST", body: { kind, items } }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: string; title: string; data: Record<string, any> }) => api(`/library/${id}`, { method: "PUT", body }),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => api(`/library/${id}`, { method: "DELETE" }), onSuccess: invalidate });
  return { q, create, update, remove };
}
