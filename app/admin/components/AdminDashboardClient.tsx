"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, ArrowLeft, Loader2, GripVertical, ChevronUp, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import AdminProjectSettings from "./AdminProjectSettings"
import AdminRegistrationList from "./AdminRegistrationList"
import AdminProjectStats from "./AdminProjectStats"
import { createProject, updateProjectsOrder } from "@/app/actions/admin"
import Link from "next/link"
import { ProjectWithRelations } from "@/app/types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableProjectItem({ 
  project, 
  isActive, 
  onClick,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: { 
  project: ProjectWithRelations, 
  isActive: boolean, 
  onClick: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  isFirst: boolean,
  isLast: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-1 items-center">
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title="เลื่อนขึ้น"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          title="เลื่อนลง"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <button
        onClick={onClick}
        className={`flex-1 flex gap-3 text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive 
            ? "bg-indigo-600 text-white shadow-md" 
            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
        }`}
      >
        {project.posterUrl ? (
          <div className="w-10 h-10 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            <img src={project.posterUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 shrink-0 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
            <Calendar className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="line-clamp-2 leading-snug text-xs sm:text-sm">{project.title}</div>
          <div className={`text-[10px] mt-1 flex items-center gap-1.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${project.isPublished ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
            {project.isPublished ? "เปิดเผยแพร่" : "ซ่อน"}
          </div>
        </div>
      </button>
    </div>
  );
}

export default function AdminDashboardClient({ initialProjects }: { initialProjects: ProjectWithRelations[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [activeProjectId, setActiveProjectId] = useState<number | null>(projects[0]?.id || null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setProjects(initialProjects)
    if (!initialProjects.find(p => p.id === activeProjectId)) {
        setActiveProjectId(initialProjects[0]?.id || null)
    }
  }, [initialProjects])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeProject = projects.find(p => p.id === activeProjectId)

  const saveOrder = async (newProjects: ProjectWithRelations[]) => {
    const orderedIds = newProjects.map(p => p.id);
    await updateProjectsOrder(orderedIds);
    router.refresh();
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex(p => p.id === active.id);
      const newIndex = projects.findIndex(p => p.id === over.id);
      
      const newProjects = arrayMove(projects, oldIndex, newIndex);
      setProjects(newProjects);
      saveOrder(newProjects);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newProjects = arrayMove(projects, index, index - 1);
      setProjects(newProjects);
      saveOrder(newProjects);
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < projects.length - 1) {
      const newProjects = arrayMove(projects, index, index + 1);
      setProjects(newProjects);
      saveOrder(newProjects);
    }
  }

  const handleCreateProject = async () => {
    setIsCreating(true)
    const res = await createProject({
      title: "โครงการใหม่",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    setIsCreating(false)
    if (res.success) {
      router.refresh()
      if (res.project?.id) {
        setActiveProjectId(res.project.id)
      }
    } else {
      alert("Error: " + res.error)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar: Project Selector */}
      <div className="w-full md:w-80 shrink-0 space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">โครงการทั้งหมด</h2>
          <button 
            onClick={handleCreateProject}
            disabled={isCreating}
            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 p-1.5 rounded-lg transition-colors"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-2">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500 italic">ไม่มีโครงการ</p>
            ) : (
              <SortableContext 
                items={projects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {projects.map((p, index) => (
                  <SortableProjectItem
                    key={p.id}
                    project={p}
                    isActive={activeProjectId === p.id}
                    onClick={() => setActiveProjectId(p.id)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    isFirst={index === 0}
                    isLast={index === projects.length - 1}
                  />
                ))}
              </SortableContext>
            )}
          </div>
        </DndContext>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {!activeProject ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium">กรุณาเลือกโครงการจากเมนูด้านซ้าย</p>
            <p className="text-sm">หรือสร้างโครงการใหม่</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AdminProjectStats key={`stats-${activeProject.id}`} project={activeProject} />
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <AdminProjectSettings key={`settings-${activeProject.id}`} project={activeProject} />
            </div>
            <AdminRegistrationList key={`regs-${activeProject.id}`} project={activeProject} />
          </div>
        )}
      </div>
    </div>
  )
}

