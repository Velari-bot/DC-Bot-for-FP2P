import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Users, DollarSign, Search } from 'lucide-react';
import { db } from '../../utils/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const CourseList = ({ onEdit, onCreate }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "courses"));
                const coursesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCourses(coursesData);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleDelete = async (e, courseId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this course permanently?")) return;

        try {
            await deleteDoc(doc(db, "courses", courseId));
            setCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (error) {
            console.error("Error deleting course:", error);
            alert("Failed to delete course");
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading courses...</div>;

    return (
        <div className="min-h-screen text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 px-2" data-aos="fade-down">
                <div>
                    <h1 className="text-5xl font-black text-white mb-2 tracking-tight">Manage Courses</h1>
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-[var(--yellow)] animate-pulse shadow-[0_0_10px_rgba(255,193,7,0.5)]"></span>
                        <p className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">Active Curriculum Control</p>
                    </div>
                </div>
                <button
                    onClick={onCreate}
                    className="bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] px-8 py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-3 shadow-2xl"
                >
                    <Plus size={16} /> New Masterclass
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-12 relative max-w-xl group" data-aos="fade-up">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[var(--yellow)] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search masterclasses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[1.5rem] py-5 pl-16 pr-6 text-white placeholder-gray-600 focus:border-[var(--yellow)]/50 outline-none transition-all duration-500 shadow-2xl font-medium"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-aos="fade-up">
                {filteredCourses.map(course => (
                    <div
                        key={course.id}
                        className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-[var(--yellow)]/30 transition-all duration-500 group flex flex-col hover:shadow-2xl"
                    >
                        {/* Thumbnail Area */}
                        <div className="aspect-video bg-black/50 relative overflow-hidden">
                            {course.thumbnail ? (
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-white/5">
                                    <BookOpen size={60} />
                                </div>
                            )}
                            <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full text-[9px] font-black text-white border border-white/10 uppercase tracking-widest">
                                {course.sections?.length || 0} SECTIONS
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 flex flex-col flex-1">
                            <h3 className="text-2xl font-black mb-2 line-clamp-1 group-hover:text-[var(--yellow)] transition-colors tracking-tight">{course.title || "Untitled Course"}</h3>
                            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-8 h-8 font-medium">
                                {course.description || "Start your journey to becoming a professional player today."}
                            </p>

                            <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.15em] mb-8 border-t border-white/5 pt-6">
                                <div className={`flex items-center gap-2 ${course.isPublic ? 'text-green-400' : 'text-red-400 opacity-50'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${course.isPublic ? 'bg-green-400' : 'bg-red-400'}`} />
                                    <span>{course.isPublic ? "LIVE" : "DRAFT"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-blue-400">
                                    <DollarSign size={12} />
                                    <span>{course.priceId ? "MONETIZED" : "FREE"}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto">
                                <button
                                    onClick={() => onEdit(course.id)}
                                    className="flex-1 bg-white/[0.05] hover:bg-white text-white hover:text-black font-black text-[10px] uppercase tracking-widest py-4 rounded-xl border border-white/10 hover:border-white transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Edit2 size={14} /> Edit Content
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, course.id)}
                                    className="w-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/10 transition-all duration-300 flex items-center justify-center active:scale-95 shadow-lg group/trash"
                                    title="Delete Course"
                                >
                                    <Trash2 size={16} className="group-hover/trash:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State Helper to Create New */}
                {filteredCourses.length === 0 && (
                    <button
                        onClick={onCreate}
                        className="border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center h-[500px] text-gray-600 hover:border-[var(--yellow)]/50 hover:text-[var(--yellow)] cursor-pointer transition-all duration-500 p-8 text-center group bg-white/[0.01] hover:bg-white/[0.03]"
                    >
                        <div className="bg-white/5 p-6 rounded-[2rem] mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-[var(--yellow)]/10">
                            <Plus size={40} />
                        </div>
                        <h3 className="font-black text-xl mb-2 text-white/50 group-hover:text-white transition-colors">Create First Course</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100">Initialize Curriculum</p>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseList;
