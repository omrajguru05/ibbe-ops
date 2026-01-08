"use client"

import React, { useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { updateTaskStatus } from "@/actions/task-actions";

// --- Draggable Task Item ---
function SortableTaskItem({ task }: { task: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, data: { type: "Task", task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 bg-gray-50 border-2 border-dashed border-orbital-ink h-[150px] rounded-2xl"
            />
        )
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
            <Link href={`/task/${task.id}`} className="block group relative">
                <div className="relative bg-white border-[3px] border-orbital-ink rounded-2xl p-5 hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing">
                    {/* Status Line */}
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] bg-orbital-ink text-white px-2 py-0.5 rounded-full font-mono uppercase">
                            ID: {task.id.slice(0, 4)}
                        </span>
                        {task.attachment_urls && task.attachment_urls.length > 0 && (
                            <span className="text-xs">📎</span>
                        )}
                    </div>

                    <h4 className="font-bold text-lg mb-2 leading-tight uppercase group-hover:text-blue-600 transition-colors">
                        {task.title}
                    </h4>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-mono uppercase">Deadline</span>
                            <span className={`text-xs font-bold font-mono ${new Date(task.deadline) < new Date() && task.status !== 'done'
                                ? "text-red-500"
                                : "text-gray-700"
                                }`}>
                                {new Date(task.deadline).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

// --- Droppable Column ---
function KanbanColumn({ id, title, tasks, color, border }: { id: string, title: string, tasks: any[], color: string, border: string }) {
    const { setNodeRef } = useSortable({ id: id, data: { type: "Column", id } });

    return (
        <div ref={setNodeRef} className="min-w-[85vw] md:min-w-[350px] flex flex-col h-full">
            <div className={`flex items-center justify-between p-4 mb-4 rounded-2xl border-2 ${border} ${color}`}>
                <h3 className="font-black uppercase italic text-lg">{title}</h3>
                <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded-full border-2 border-inherit">
                    {tasks.length}
                </span>
            </div>

            <div className="flex-1 space-y-4">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskItem key={task.id} task={task} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center opacity-50">
                        Drop Tasks Here
                    </div>
                )}
            </div>
        </div>
    )
}


export function KanbanBoard({ tasks: initialTasks }: { tasks: any[] }) {
    const [tasks, setTasks] = useState(initialTasks);
    const [activeTask, setActiveTask] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 10 } }), // 10px movement to start drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const columns = ["todo", "in_progress", "done"];

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
        }
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === "Task";
        const isOverTask = over.data.current?.type === "Task";

        if (!isActiveTask) return;

        // Convert string IDs mostly
        const activeTask = tasks.find(t => t.id === activeId);

        // Dropping over another task
        if (isActiveTask && isOverTask) {
            const overTask = tasks.find(t => t.id === overId);
            if (activeTask && overTask && activeTask.status !== overTask.status) {
                setTasks((tasks) => {
                    const activeIndex = tasks.findIndex((t) => t.id === activeId);
                    const overIndex = tasks.findIndex((t) => t.id === overId);

                    // Optimistic UI update for visual column change
                    const newTasks = [...tasks];
                    newTasks[activeIndex] = { ...newTasks[activeIndex], status: overTask.status };
                    return arrayMove(newTasks, activeIndex, overIndex);
                });
            }
        }

        // Dropping over a column
        const isOverColumn = over.data.current?.type === "Column";
        if (isActiveTask && isOverColumn) {
            const overColumnId = overId as string;
            if (activeTask && activeTask.status !== overColumnId) {
                setTasks((tasks) => {
                    const activeIndex = tasks.findIndex((t) => t.id === activeId);
                    const newTasks = [...tasks];
                    // Update status locally
                    newTasks[activeIndex] = { ...newTasks[activeIndex], status: overColumnId };
                    // Using arrayMove here might stay in same index but diff column list if we don't fetch real index?
                    // Actually arrayMove is for same list. Here we are just changing property "status".
                    // But SortableContext needs items in order.
                    return arrayMove(newTasks, activeIndex, activeIndex);
                });
            }
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        let newStatus = activeTask.status;

        if (over.data.current?.type === "Column") {
            newStatus = overId;
        } else if (over.data.current?.type === "Task") {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) newStatus = overTask.status;
        }

        if (activeTask.status !== newStatus) {
            // Final Server Action Call
            updateTaskStatus(activeId, newStatus);

            // Ensure local state is consistent
            setTasks(tasks.map(t =>
                t.id === activeId ? { ...t, status: newStatus } : t
            ));
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-8 h-[calc(100vh-200px)]">
                <KanbanColumn
                    id="todo"
                    title="To Do"
                    tasks={tasks.filter(t => t.status === "todo")}
                    color="bg-gray-100"
                    border="border-gray-300"
                />
                <KanbanColumn
                    id="in_progress"
                    title="In Progress"
                    tasks={tasks.filter(t => t.status === "in_progress")}
                    color="bg-blue-50"
                    border="border-blue-300"
                />
                <KanbanColumn
                    id="done"
                    title="Done"
                    tasks={tasks.filter(t => t.status === "done")}
                    color="bg-green-50"
                    border="border-green-300"
                />
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="relative bg-white border-[3px] border-orbital-ink rounded-2xl p-5 shadow-2xl rotate-3 cursor-grabbing">
                        <h4 className="font-bold text-lg mb-2 leading-tight uppercase">{activeTask.title}</h4>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
