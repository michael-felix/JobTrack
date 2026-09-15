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

const STAGE_COLORS: Record<ApplicationStage, string> = {
  SAVED: "border-t-slate-400",
  APPLIED: "border-t-blue-500",
  SCREENING: "border-t-purple-500",
  INTERVIEW: "border-t-amber-500",
  OFFER: "border-t-green-500",
  REJECTED: "border-t-red-500",
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
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add application
        </button>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              colorClass={STAGE_COLORS[stage]}
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
  colorClass,
  applications,
  onOpen,
}: {
  stage: ApplicationStage;
  colorClass: string;
  applications: ApplicationSummary[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[300px] rounded-lg border border-slate-200 bg-slate-100/60 p-2 dark:border-slate-800 dark:bg-slate-900/40 ${
        isOver ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <h2 className="mb-2 px-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {STAGE_LABELS[stage]} <span className="text-slate-400">({applications.length})</span>
      </h2>
      <div className="space-y-2">
        {applications.map((application) => (
          <Card key={application.id} application={application} colorClass={colorClass} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function Card({
  application,
  colorClass,
  onOpen,
}: {
  application: ApplicationSummary;
  colorClass: string;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: application.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(application.id)}
      className={`cursor-grab rounded-md border-t-4 bg-white p-3 shadow-sm hover:shadow dark:bg-slate-800 ${colorClass} ${
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
      <p className="font-medium">{application.jobTitle}</p>
      <p className="text-sm text-slate-500">{application.company}</p>
      {application.location && <p className="text-xs text-slate-400">{application.location}</p>}
      {application.followUpDate && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Follow up: {new Date(application.followUpDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
