import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Plus, Pencil, Trash2, MessageSquare, PhoneCall, CalendarDays, StickyNote, ListTodo } from "lucide-react";
import { Link, useRoute } from "wouter";
import LeadForm from "@/components/LeadForm";
import type { Lead, Activity } from "@shared/schema";

const STAGE_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", qualified: "Qualified",
  proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  qualified: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  proposal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  negotiation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  won: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ACTIVITY_ICONS: Record<string, any> = {
  email: Mail,
  call: PhoneCall,
  meeting: CalendarDays,
  note: StickyNote,
  task: ListTodo,
};

const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
  { value: "task", label: "Task" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
}

function formatDate(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LeadDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/leads/:id");
  const leadId = params?.id;
  const [editOpen, setEditOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");

  const { data: lead, isLoading: leadLoading } = useQuery<Lead>({
    queryKey: ["/api/leads", leadId],
    enabled: !!leadId,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities", `?leadId=${leadId}`],
    enabled: !!leadId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/leads/${leadId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditOpen(false);
      toast({ title: "Lead updated" });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/activities", {
        ...data,
        leadId,
        userId: user?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setActivityOpen(false);
      setActivityTitle("");
      setActivityDesc("");
      toast({ title: "Activity added" });
    },
  });

  const toggleActivityMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/activities/${id}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Activity deleted" });
    },
  });

  if (leadLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 md:p-6">
        <p>Lead not found</p>
        <Link href="/leads">
          <Button variant="ghost" className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Leads
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-semibold text-primary">
                {lead.firstName[0]}{lead.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-lead-name">
                {lead.firstName} {lead.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lead.company}{lead.position ? ` - ${lead.position}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full ${STAGE_COLORS[lead.stage]}`}>
            {STAGE_LABELS[lead.stage]}
          </span>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" data-testid="button-edit-lead">
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
              </DialogHeader>
              <LeadForm
                defaultValues={lead}
                onSubmit={(data) => updateMutation.mutate(data)}
                isPending={updateMutation.isPending}
                submitLabel="Save Changes"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Lead details */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${lead.email}`} className="text-primary truncate" target="_blank" rel="noopener noreferrer" data-testid="link-email">
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${lead.phone}`} className="text-primary" data-testid="link-phone">
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.position && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{lead.position}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value</span>
                <span className="font-medium">{formatCurrency(lead.value ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="capitalize">{lead.source.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="capitalize">{lead.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Contact</span>
                <span>{formatDate(lead.lastContactedAt)}</span>
              </div>
              {lead.tags && (
                <div className="pt-2">
                  <span className="text-muted-foreground block mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.split(",").map((tag) => (
                      <Badge key={tag.trim()} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {lead.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Activities</CardTitle>
              <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-activity">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Activity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Type</label>
                      <Select value={activityType} onValueChange={setActivityType}>
                        <SelectTrigger data-testid="select-activity-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Title</label>
                      <Input
                        data-testid="input-activity-title"
                        value={activityTitle}
                        onChange={(e) => setActivityTitle(e.target.value)}
                        placeholder="Activity title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Description</label>
                      <Textarea
                        data-testid="input-activity-desc"
                        value={activityDesc}
                        onChange={(e) => setActivityDesc(e.target.value)}
                        placeholder="Details..."
                        rows={3}
                      />
                    </div>
                    <Button
                      className="w-full"
                      data-testid="button-submit-activity"
                      disabled={!activityTitle || createActivityMutation.isPending}
                      onClick={() => {
                        createActivityMutation.mutate({
                          type: activityType,
                          title: activityTitle,
                          description: activityDesc || null,
                        });
                      }}
                    >
                      {createActivityMutation.isPending ? "Saving..." : "Add Activity"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activities yet. Add your first activity.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const IconComp = ACTIVITY_ICONS[activity.type] || StickyNote;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-md border border-border/50"
                        data-testid={`card-activity-${activity.id}`}
                      >
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                          <IconComp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${activity.completed ? "line-through text-muted-foreground" : ""}`}>
                              {activity.title}
                            </span>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {activity.type}
                            </Badge>
                          </div>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(activity.type === "task" || activity.type === "meeting") && (
                            <Checkbox
                              data-testid={`checkbox-activity-${activity.id}`}
                              checked={activity.completed ?? false}
                              onCheckedChange={(checked) => {
                                toggleActivityMutation.mutate({
                                  id: activity.id,
                                  completed: checked as boolean,
                                });
                              }}
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-activity-${activity.id}`}
                            onClick={() => deleteActivityMutation.mutate(activity.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
