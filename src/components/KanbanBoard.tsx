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

const STAGE_DOT: Record<ApplicationStage, string> = {
  SAVED: "bg-stage-saved dark:bg-stage-dark-saved",
  APPLIED: "bg-stage-applied dark:bg-stage-dark-applied",
  SCREENING: "bg-stage-screening dark:bg-stage-dark-screening",
  INTERVIEW: "bg-stage-interview dark:bg-stage-dark-interview",
  OFFER: "bg-stage-offer dark:bg-stage-dark-offer",
  REJECTED: "bg-stage-rejected dark:bg-stage-dark-rejected",
};

export function KanbanBoard({ initialApplications }: { initialApplications: ApplicationSummary[] }) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          + Add application
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              applications={applications.filter((a) => a.stage === stage)}
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

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] rounded-xl border border-hairline/70 bg-surface/40 p-2.5 transition-colors dark:border-hairline-dark/70 dark:bg-surface-dark/30 ${
        isOver ? "border-accent bg-accent-soft/40 dark:border-accent-dark dark:bg-accent-soft-dark/40" : ""
      }`}
    >
      <h2 className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-muted-dark">
        <span className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[stage]}`} />
        {STAGE_LABELS[stage]}
        <span className="text-ink-faint dark:text-ink-faint-dark">{applications.length}</span>
      </h2>
      <div className="space-y-2">
        {applications.map((application) => (
          <Card key={application.id} application={application} onOpen={onOpen} />
        ))}
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: application.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    // dnd-kit updates `transform` on every pointer move via this inline
    // style; the hover/press CSS transition below also targets `transform`,
    // so without this override each drag update gets eased instead of
    // applied instantly, making the card visibly lag behind the cursor.
    transition: isDragging ? "none" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(application.id)}
      className={`cursor-grab rounded-lg border border-hairline bg-surface p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md active:scale-[0.98] dark:border-hairline-dark dark:bg-surface-dark dark:hover:border-accent-dark/40 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <CardContent application={application} />
    </div>
  );
}

function CardContent({ application }: { application: ApplicationSummary }) {
  return (
    <div>
      <p className="font-serif text-base italic font-medium leading-snug text-ink dark:text-ink-dark">
        {application.company}
      </p>
      <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-muted-dark">{application.jobTitle}</p>
      {application.location && (
        <p className="mt-0.5 text-xs text-ink-faint dark:text-ink-faint-dark">{application.location}</p>
      )}
      {application.followUpDate && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-hover dark:bg-accent-soft-dark dark:text-accent-dark">
          Follow up {new Date(application.followUpDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
