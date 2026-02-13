import React, { useEffect, useState, useRef } from 'react'
import { MenuIcon, XIcon, ExternalLink, Crown, User, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { auth } from '../../utils/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ASSETS_URL } from '../../utils/constants'
import AnnouncementBar from './AnnouncementBar'

const NavBar = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [signInModalOpen, setSignInModalOpen] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [underlineStyle, setUnderlineStyle] = useState({
        left: 0,
        width: 0,
    })
    const [user, setUser] = useState(null)

    const navLinksRef = useRef([])
    const navbarRef = useRef(null)
    const location = useLocation()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
        })
        return () => unsubscribe()
    }, [])

    const navLinks = [
        {
            name: 'Home',
            href: '',
            color: '#FACC24', // Yellow
        },
        {
            name: 'Fighting',
            subtitle: '0-50k PR',
            href: 'fighting-masterclass',
            isNew: true,
            color: '#A855F7', // Purple
        },
        {
            name: 'Beginner',
            subtitle: '0-1k PR',
            href: 'beginner-masterclass',
            color: '#22C55E', // Green
        },
        {
            name: 'Intermediate',
            subtitle: '1-10k PR',
            href: 'intermediate-masterclass',
            color: '#F97316', // Orange
        },
        {
            name: 'Advanced',
            subtitle: '10-50k PR',
            href: 'advanced-masterclass',
            color: '#EF4444', // Red
        },
        {
            name: 'Coaching',
            href: 'coaching',
            color: '#FACC24', // Yellow
        },
    ]
    // Make underline/active tab correct on initial load & route changes
    useEffect(() => {
        const currentPath = location.pathname.replace(/\/+$/, '') || '/'
        const foundIndex = navLinks.findIndex((link) => {
            const linkPath = link.href ? `/${link.href}` : '/'
            return linkPath === currentPath
        })
        setActiveIndex(foundIndex === -1 ? 0 : foundIndex)
    }, [location.pathname])

    useEffect(() => {
        const updateUnderline = () => {
            const index = hoveredIndex !== null ? hoveredIndex : activeIndex
            const element = navLinksRef.current[index]
            const navbar = navbarRef.current
            if (element && navbar) {
                const navbarRect = navbar.getBoundingClientRect()
                const elementRect = element.getBoundingClientRect()
                const offsetLeft = elementRect.left - navbarRect.left
                setUnderlineStyle({
                    left: offsetLeft + elementRect.width / 2 - 40,
                    width: 80,
                })
            }
        }

        updateUnderline()
        window.addEventListener('resize', updateUnderline)

        return () => {
            window.removeEventListener('resize', updateUnderline)
        }
    }, [hoveredIndex, activeIndex])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1040) {
                setIsOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const isCompactRoute = location.pathname.startsWith('/course/') || location.pathname === '/claim' || location.pathname === '/admin'
    const isPlayerPage = location.pathname.startsWith('/course/')

    if (isPlayerPage && window.innerWidth < 768) return null

    return (
        <>
            <nav
                ref={navbarRef}
                className={`fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${isCompactRoute ? 'md:bg-[#050505]/80' : ''}`}
            >
                {(!isCompactRoute || window.innerWidth > 768) && <AnnouncementBar />}
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative transition-all duration-300 ${isCompactRoute ? 'py-1 md:py-2' : 'py-2'}`}>
                    <div className={`flex items-center justify-between transition-all duration-300 ${isCompactRoute ? 'h-14 md:h-16' : 'h-16'}`}>
                        {/* Logo and Brand */}
                        <Link
                            to="/"
                            className="flex items-center gap-2 flex-shrink-0 cursor-pointer transition-all duration-300 hover:opacity-60"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <img
                                src="https://assets.fortnitepathtopro.com/assets/logo.png"
                                alt="Fortnite Path To Pro Logo"
                                className={`transition-all duration-300 ${isCompactRoute ? 'h-8 w-8 md:h-10 md:w-10' : 'h-10 w-10'}`}
                            />
                            <div className="flex flex-col">
                                <span className={`text-white font-bold leading-tight transition-all duration-300 ${isCompactRoute ? 'text-sm md:text-lg' : 'text-lg'}`}>
                                    Fortnite
                                </span>
                                <span className={`text-white font-bold leading-tight transition-all duration-300 ${isCompactRoute ? 'text-sm md:text-lg' : 'text-lg'}`}>
                                    Path To Pro
                                </span>
                            </div>
                        </Link>


                        {/* Desktop Navigation - Centered */}
                        <div className="hidden min-[1040px]:flex items-center absolute left-1/2 transform -translate-x-1/2">
                            {navLinks.map((link, index) => (
                                <React.Fragment key={link.name}>
                                    {/* small vertical line between items */}
                                    {index > 0 && (
                                        <div className="h-6 w-px bg-white/25 mx-1" />
                                    )}

                                    <Link
                                        ref={(el) => (navLinksRef.current[index] = el)}
                                        to={`/${link.href}`}
                                        className="relative px-6 py-2 text-center transition-all duration-500 w-[140px] h-[48px] flex items-center justify-center rounded-xl group"
                                        style={{
                                            backgroundColor: (index === activeIndex || hoveredIndex === index)
                                                ? (hoveredIndex === index ? `${link.color}1A` : `${link.color}0D`)
                                                : 'rgba(255, 255, 255, 0.02)',
                                            boxShadow: (index === activeIndex || hoveredIndex === index)
                                                ? (hoveredIndex === index ? `0 0 35px ${link.color}33` : `0 0 25px ${link.color}1A`)
                                                : 'none',
                                            border: (index === activeIndex || hoveredIndex === index)
                                                ? `1px solid ${hoveredIndex === index ? `${link.color}66` : `${link.color}33`}`
                                                : '1px solid rgba(255, 255, 255, 0.05)',
                                        }}
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        onClick={() => {
                                            setActiveIndex(index);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                    >
                                        {link.isNew && (
                                            <div className="absolute -top-1.5 -right-1 z-20 transition-transform duration-300 group-hover:scale-110">
                                                <div className="relative flex items-center justify-center">
                                                    <div className="absolute inset-0 blur-[6px] opacity-40 animate-pulse" style={{ backgroundColor: 'var(--yellow)' }}></div>
                                                    <span className="relative text-[9px] text-black font-black px-2 py-0.5 rounded-full leading-none tracking-tight shadow-lg" style={{ backgroundColor: 'var(--yellow)' }}>
                                                        NEW
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col relative z-0 transition-transform duration-300 group-hover:scale-105 text-center">
                                            <span className="text-white font-bold text-sm whitespace-nowrap transition-colors">
                                                {link.name}
                                            </span>
                                            <span className="text-gray-400 text-[10px] whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                                                {link.subtitle}
                                            </span>
                                        </div>
                                    </Link>
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Desktop Sign-In Button / Profile */}
                        <div className="hidden min-[1040px]:flex items-center">
                            {user ? (
                                <button
                                    onClick={() => setSignInModalOpen(true)}
                                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full pl-2 pr-4 py-1.5 transition-all group"
                                >
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            className="w-8 h-8 rounded-full object-cover border border-white/20"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[var(--yellow)]/20 text-[var(--yellow)] flex items-center justify-center border border-[var(--yellow)]/30">
                                            <User size={16} />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <p className="text-white text-xs font-bold leading-none mb-0.5">{user.displayName || user.email?.split('@')[0] || "User"}</p>
                                        <p className="text-[10px] text-gray-400 leading-none">Account</p>
                                    </div>
                                </button>
                            ) : (
                                <button
                                    className="bg-gradient-to-r from-[var(--yellow)] to-yellow-400 text-black font-bold text-sm px-6 py-2.5 rounded-lg hover:from-yellow-400 hover:to-[var(--yellow)] transition-all duration-300 shadow-[0_0_20px_rgba(250,204,36,0.3)] hover:shadow-[0_0_25px_rgba(250,204,36,0.5)] transform"
                                    onClick={() => setSignInModalOpen(true)}
                                >
                                    Sign In
                                </button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-white p-2 transition-transform duration-300 active:scale-95 min-[1040px]:hidden"
                        >
                            <div className="relative w-6 h-6">
                                <MenuIcon
                                    size={24}
                                    className={`absolute inset-0 transition-all duration-300 ${isOpen
                                        ? 'opacity-0 rotate-90 scale-0'
                                        : 'opacity-100 rotate-0 scale-100'
                                        }`}
                                />
                                <XIcon
                                    size={24}
                                    className={`absolute inset-0 transition-all duration-300 ${isOpen
                                        ? 'opacity-100 rotate-0 scale-100'
                                        : 'opacity-0 -rotate-90 scale-0'
                                        }`}
                                />
                            </div>
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    <div
                        className={`min-[1040px]:hidden overflow-hidden transition-all duration-400 ease-in-out ${isOpen
                            ? 'max-h-[500px] opacity-100'
                            : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="pb-6">
                            {navLinks.map((link, index) => (
                                <Link
                                    key={link.name}
                                    to={`/${link.href}`}
                                    className={`py-3 px-4 border-t border-white/10 rounded-lg transition-all duration-300 hover:translate-x-2 active:scale-[0.97] h-[70px] flex flex-col justify-center relative ${activeIndex === index
                                        ? 'text-white border-l-2 border-l-white'
                                        : 'text-gray-400'
                                        } ${isOpen
                                            ? 'translate-x-0 opacity-100'
                                            : '-translate-x-8 opacity-0'
                                        }`}
                                    onClick={() => {
                                        setActiveIndex(index)
                                        setIsOpen(false)
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    {link.isNew && (
                                        <div className="absolute top-4 right-4 flex items-center gap-2">
                                            <div className="relative flex items-center justify-center">
                                                <div className="absolute inset-0 blur-[4px] opacity-30 animate-pulse" style={{ backgroundColor: 'var(--yellow)' }}></div>
                                                <span className="relative text-[9px] text-black font-black px-2 py-0.5 rounded-full leading-none shadow-lg" style={{ backgroundColor: 'var(--yellow)' }}>
                                                    NEW
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="font-bold text-lg text-white">{link.name}</div>
                                    <div className="text-sm opacity-80">
                                        {link.subtitle}
                                    </div>
                                </Link>
                            ))}
                            <div
                                className={`border-t border-white/10 mt-2 p-4 transition-all duration-300 ${isOpen
                                    ? 'translate-x-0 opacity-100'
                                    : '-translate-x-8 opacity-0'
                                    }`}
                            >
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setSignInModalOpen(true);
                                    }}
                                    className="w-full bg-gradient-to-r from-[var(--yellow)] to-yellow-400 text-black font-bold text-sm px-6 py-3 rounded-lg hover:from-yellow-400 hover:to-[var(--yellow)] transition-all duration-300 shadow-[0_0_20px_rgba(250,204,36,0.3)] hover:shadow-[0_0_25px_rgba(250,204,36,0.5)] transform flex items-center justify-center gap-2"
                                >
                                    {user ? (
                                        <>
                                            {user.photoURL && (
                                                <img
                                                    src={user.photoURL}
                                                    alt={user.displayName}
                                                    className="w-6 h-6 rounded-full object-cover border border-black/10"
                                                />
                                            )}
                                            <span>{user.displayName || user.email?.split('@')[0] || "My Account"}</span>
                                        </>

                                    ) : (
                                        "Sign In"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="absolute bottom-0 left-0 h-1 transition-all duration-300 ease-out hidden min-[1040px]:block"
                    style={{
                        left: `${underlineStyle.left}px`,
                        width: `${underlineStyle.width}px`,
                        backgroundColor: navLinks[hoveredIndex !== null ? hoveredIndex : activeIndex]?.color || '#FACC24'
                    }}
                />
            </nav >

            {/* Sign In Selection Modal */}
            {

                signInModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSignInModalOpen(false)}>
                        <div
                            className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-md p-8 relative shadow-2xl transform transition-all scale-100 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Ambient Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FACC24]/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-green-500/5 rounded-full blur-[60px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

                            <button
                                onClick={() => setSignInModalOpen(false)}
                                className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
                            >
                                <XIcon size={20} />
                            </button>

                            <div className="text-center mb-8 relative z-10">
                                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                    {user ? (
                                        <>Welcome Back!</>
                                    ) : (
                                        <>Sign In</>
                                    )}
                                </h2>
                                {user && (
                                    <p className="text-[#FACC24] font-medium text-sm">
                                        {user.displayName || user.email?.split('@')[0]}
                                    </p>
                                )}
                                {!user && (
                                    <p className="text-gray-400 text-sm">Select an option to continue</p>
                                )}
                            </div>

                            <div className="space-y-4 relative z-10">
                                {/* Option 1: Player Dashboard */}
                                <Link
                                    to="/claim"
                                    className="group relative block w-full bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-[#FACC24]/50 p-6 rounded-2xl transition-all duration-300"
                                    onClick={() => setSignInModalOpen(false)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#FACC24]/30 transition-all duration-300 shadow-xl shrink-0">
                                            <Crown size={28} className="text-gray-300 group-hover:text-[#FACC24] transition-colors" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-white font-bold text-xl leading-tight group-hover:text-[#FACC24] transition-colors">{user ? "Player Dashboard" : "Sign In / Join"}</h3>
                                            <p className="text-gray-500 text-xs mt-1.5 group-hover:text-gray-400 transition-colors">{user ? "Access your courses & coaching" : "Access your masterclasses & sessions"}</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                            <ChevronRight size={24} className="text-[#FACC24]" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Option 2: Podia (Backward Compatibility) */}
                                <a
                                    href="https://masterclass.fortnitepathtopro.com/products/home"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block w-full bg-red-600/5 hover:bg-red-600/10 border border-red-900/20 hover:border-red-500/50 p-6 rounded-2xl transition-all duration-300"
                                    onClick={() => setSignInModalOpen(false)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-950 to-black border border-red-900/20 flex items-center justify-center group-hover:scale-110 group-hover:border-red-500/30 transition-all duration-300 shadow-xl shrink-0">
                                            <ExternalLink size={28} className="text-red-400 group-hover:text-red-500 transition-colors" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-white font-bold text-xl leading-tight group-hover:text-red-400 transition-colors">Access Old Podia</h3>
                                            <p className="text-gray-500 text-xs mt-1.5 group-hover:text-gray-400 transition-colors">Usage available until end of month</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                            <ChevronRight size={24} className="text-red-500" />
                                        </div>
                                    </div>
                                </a>
                            </div>

                            {user && (
                                <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
                                    <button
                                        onClick={async () => {
                                            await auth.signOut();
                                            setSignInModalOpen(false);
                                            window.location.reload();
                                        }}
                                        className="text-sm text-gray-500 hover:text-red-400 transition-colors font-medium px-4 py-2 hover:bg-white/5 rounded-lg"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </>
    )
}

export default NavBar
