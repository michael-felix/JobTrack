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
import { ApplicationStage, ApplicationSummary, STAGES, STAGE_LABELS } from "@/lib/types";
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

export function KanbanBoard({ initialApplications }: { initialApplications: ApplicationSummary[] }) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showRejected, setShowRejected] = useState(false);
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

  const activeApplication = applications.find((a) => a.id === activeId);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? applications.filter(
        (a) => a.company.toLowerCase().includes(query) || a.jobTitle.toLowerCase().includes(query)
      )
    : applications;

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
}: {
  stage: ApplicationStage;
  applications: ApplicationSummary[];
  onOpen: (id: string) => void;
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
          <Card key={application.id} application={application} onOpen={onOpen} />
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
}: {
  application: ApplicationSummary;
  onOpen: (id: string) => void;
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
      className={`cursor-grab rounded-lg border border-hairline bg-surface p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md active:scale-[0.98] dark:border-hairline-dark dark:bg-surface-dark dark:hover:border-accent-dark/40 border-l-[3px] ${CARD_ACCENT.border} ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <CardContent application={application} />
    </div>
  );
}

function CardContent({ application }: { application: ApplicationSummary }) {
  return (
    <div className="flex gap-2.5">
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
        {application.followUpDate && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-hover dark:bg-accent-soft-dark dark:text-accent-dark">
            Follow up {new Date(application.followUpDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
