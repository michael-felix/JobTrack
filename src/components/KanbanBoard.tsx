"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ApplicationStage, ApplicationSummary, LabelData, STAGES, STAGE_LABELS } from "@/lib/types";
import { NewApplicationModal } from "@/components/NewApplicationModal";

// Card accent (left border + avatar) is one consistent brand color across
// every stage now, rather than a different color per stage — the column
// wash/dot still carry per-stage color so columns stay distinguishable.
const CARD_ACCENT = {
  border: "border-l-accent dark:border-l-accent-dark",
  avatar: "bg-accent-soft text-accent-hover dark:bg-accent-soft-dark dark:text-accent-dark",
};

const STAGE_STYLES: Record<ApplicationStage, { dot: string; wash: string; text: string }> = {
  SAVED: {
    dot: "bg-stage-saved dark:bg-stage-dark-saved",
    wash: "bg-stage-saved/[0.06] dark:bg-stage-dark-saved/[0.06]",
    text: "text-stage-saved dark:text-stage-dark-saved",
  },
  APPLIED: {
    dot: "bg-stage-applied dark:bg-stage-dark-applied",
    wash: "bg-stage-applied/[0.06] dark:bg-stage-dark-applied/[0.06]",
    text: "text-stage-applied dark:text-stage-dark-applied",
  },
  SCREENING: {
    dot: "bg-stage-screening dark:bg-stage-dark-screening",
    wash: "bg-stage-screening/[0.06] dark:bg-stage-dark-screening/[0.06]",
    text: "text-stage-screening dark:text-stage-dark-screening",
  },
  INTERVIEW: {
    dot: "bg-stage-interview dark:bg-stage-dark-interview",
    wash: "bg-stage-interview/[0.06] dark:bg-stage-dark-interview/[0.06]",
    text: "text-stage-interview dark:text-stage-dark-interview",
  },
  OFFER: {
    dot: "bg-stage-offer dark:bg-stage-dark-offer",
    wash: "bg-stage-offer/[0.06] dark:bg-stage-dark-offer/[0.06]",
    text: "text-stage-offer dark:text-stage-dark-offer",
  },
  REJECTED: {
    dot: "bg-stage-rejected dark:bg-stage-dark-rejected",
    wash: "bg-stage-rejected/[0.06] dark:bg-stage-dark-rejected/[0.06]",
    text: "text-stage-rejected dark:text-stage-dark-rejected",
  },
};

/** Stable sort — keeps pinned applications first while preserving whatever
 * secondary order the server already applied (the user's chosen sort
 * preference), so a client-side pin toggle doesn't need to know that order
 * itself to stay correct. */
function withPinnedFirst(apps: ApplicationSummary[]): ApplicationSummary[] {
  return [...apps].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export function KanbanBoard({
  initialApplications,
  labels,
}: {
  initialApplications: ApplicationSummary[];
  labels: LabelData[];
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showRejected, setShowRejected] = useState(false);
  const [activeLabelIds, setActiveLabelIds] = useState<string[]>([]);

  function toggleLabelFilter(id: string) {
    setActiveLabelIds((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  }
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const applicationId = String(active.id);
    const toStage = over.id as ApplicationStage;

    const current = applications.find((a) => a.id === applicationId);
    if (!current || current.stage === toStage) return;

    const previous = applications;
    setApplications((apps) => apps.map((a) => (a.id === applicationId ? { ...a, stage: toStage } : a)));

    const res = await fetch(`/api/applications/${applicationId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStage }),
    });
    if (!res.ok) {
      setApplications(previous);
    }
  }

  function handleCreated(application: ApplicationSummary) {
    setApplications((apps) => [application, ...apps]);
    setModalOpen(false);
  }

  async function handleTogglePin(id: string) {
    const current = applications.find((a) => a.id === id);
    if (!current) return;
    const previous = applications;
    setApplications((apps) =>
      withPinnedFirst(apps.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)))
    );

    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !current.pinned }),
    });
    if (!res.ok) {
      setApplications(previous);
    }
  }

  const activeApplication = applications.find((a) => a.id === activeId);

  const query = search.trim().toLowerCase();
  const filtered = applications
    .filter((a) => !query || a.company.toLowerCase().includes(query) || a.jobTitle.toLowerCase().includes(query))
    .filter((a) => activeLabelIds.length === 0 || a.labels.some((l) => activeLabelIds.includes(l.id)));

  const rejectedCount = applications.filter((a) => a.stage === "REJECTED").length;
  const visibleStages = showRejected ? STAGES : STAGES.filter((s) => s !== "REJECTED");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {STAGES.map((stage) => {
            const count = applications.filter((a) => a.stage === stage).length;
            return (
              <span
                key={stage}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-ink-muted dark:border-hairline-dark dark:bg-surface-dark dark:text-ink-muted-dark"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${STAGE_STYLES[stage].dot}`} />
                {STAGE_LABELS[stage]}
                <span className={STAGE_STYLES[stage].text}>{count}</span>
              </span>
            );
          })}
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          + Add application
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="field-input mt-0 max-w-xs"
          placeholder="Search company or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {rejectedCount > 0 && (
          <button
            onClick={() => setShowRejected((v) => !v)}
            className="text-sm font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline dark:text-ink-muted-dark dark:hover:text-ink-dark"
          >
            {showRejected ? "Hide" : "Show"} rejected ({rejectedCount})
          </button>
        )}
        {labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {labels.map((label) => {
              const active = activeLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => toggleLabelFilter(label.id)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity"
                  style={
                    active
                      ? { backgroundColor: `${label.color}22`, color: label.color, boxShadow: `0 0 0 1px ${label.color}` }
                      : { backgroundColor: `${label.color}22`, color: label.color, opacity: 0.45 }
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                </button>
              );
            })}
            {activeLabelIds.length > 0 && (
              <button
                onClick={() => setActiveLabelIds([])}
                className="text-xs font-medium text-ink-faint hover:text-ink-muted dark:text-ink-faint-dark dark:hover:text-ink-muted-dark"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
            showRejected ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >
          {visibleStages.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              applications={filtered.filter((a) => a.stage === stage)}
              onOpen={(id) => router.push(`/applications/${id}`)}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApplication ? <CardContent application={activeApplication} /> : null}
        </DragOverlay>
      </DndContext>

      {modalOpen && <NewApplicationModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />}
    </div>
  );
}

function Column({
  stage,
  applications,
  onOpen,
  onTogglePin,
}: {
  stage: ApplicationStage;
  applications: ApplicationSummary[];
  onOpen: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const styles = STAGE_STYLES[stage];

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[140px] max-h-[calc(100dvh-320px)] flex-col rounded-xl border border-hairline/70 p-2.5 transition-colors dark:border-hairline-dark/70 ${
        isOver ? "border-accent bg-accent-soft/40 dark:border-accent-dark dark:bg-accent-soft-dark/40" : styles.wash
      }`}
    >
      <h2 className="mb-3 flex shrink-0 items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        {STAGE_LABELS[stage]}
        <span className="text-ink-faint dark:text-ink-faint-dark">{applications.length}</span>
      </h2>
      <div className="board-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {applications.map((application) => (
          <Card key={application.id} application={application} onOpen={onOpen} onTogglePin={onTogglePin} />
        ))}
        {applications.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 py-7 text-center">
            <span className={`text-base ${styles.text} opacity-60`}>·</span>
            <p className="text-xs text-ink-faint dark:text-ink-faint-dark">No applications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  application,
  onOpen,
  onTogglePin,
}: {
  application: ApplicationSummary;
  onOpen: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  // Deliberately not applying dnd-kit's `transform` here: the board already
  // renders a <DragOverlay> that follows the cursor, so also translating
  // this source element would draw two moving copies — this one lagging a
  // frame behind (it goes through a React re-render on every pointer move)
  // and the overlay tracking the pointer smoothly on top of it. Leaving the
  // source in place and just dimming it is the standard DragOverlay pattern.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(application.id)}
      className={`group relative cursor-grab rounded-lg border border-hairline bg-surface p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md active:scale-[0.98] dark:border-hairline-dark dark:bg-surface-dark dark:hover:border-accent-dark/40 border-l-[3px] ${CARD_ACCENT.border} ${
        isDragging ? "opacity-40" : ""
      } ${application.pinned ? "bg-accent-soft/30 dark:bg-accent-soft-dark/30" : ""}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(application.id);
        }}
        title={application.pinned ? "Unpin" : "Pin to top"}
        className={`absolute right-2 top-2 rounded-md p-1 transition-opacity ${
          application.pinned
            ? "text-accent opacity-100 dark:text-accent-dark"
            : "text-ink-faint opacity-0 hover:text-accent group-hover:opacity-100 dark:text-ink-faint-dark dark:hover:text-accent-dark"
        }`}
      >
        <StarIcon filled={application.pinned} />
      </button>
      <CardContent application={application} />
    </div>
  );
}

function CardContent({ application }: { application: ApplicationSummary }) {
  return (
    <div className="flex gap-2.5 pr-5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-sm italic font-semibold ${CARD_ACCENT.avatar}`}
      >
        {application.company.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate font-serif text-base italic font-medium leading-snug text-ink dark:text-ink-dark">
          {application.company}
        </p>
        <p className="truncate text-sm text-ink-muted dark:text-ink-muted-dark">{application.jobTitle}</p>
        {application.location && (
          <p className="truncate text-xs text-ink-faint dark:text-ink-faint-dark">{application.location}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {application.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${label.color}22`, color: label.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: label.color }} />
              {label.name}
            </span>
          ))}
          {application.followUpDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-hover dark:bg-accent-soft-dark dark:text-accent-dark">
              Follow up {new Date(application.followUpDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5l2.6 5.6 6.15.66-4.6 4.2 1.28 6.04L12 15.9l-5.43 3.1 1.28-6.04-4.6-4.2 6.15-.66L12 2.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
