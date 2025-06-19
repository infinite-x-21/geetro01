import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Music, Podcast, FileAudio, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Categories list
const FILTERS = [
	{ id: "all", label: "All", icon: Home },
	{ id: "music", label: "Music", icon: Music },
	{ id: "podcast", label: "Podcast", icon: Podcast },
	{ id: "stories", label: "Stories", icon: FileAudio },
];

interface HeroSectionProps {
	active: string;
	setActive: (val: string) => void;
	search: string;
	setSearch: (val: string) => void;
}

export default function HeroSection({
	active,
	setActive,
	search,
	setSearch,
}: HeroSectionProps) {
	const navigate = useNavigate();

	return (
		<section
			className="w-full flex flex-col items-center justify-center pt-3 pb-8 bg-background relative"
			style={{
				backgroundImage: "url('/images/geetro-x.jpeg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		>
			{/* Dark overlay for better text readability */}
			<div className="absolute inset-0 bg-black/70"></div>

			{/* Content with relative positioning */}
			<div className="relative z-10 w-full flex flex-col items-center">
				{/* App title and tagline */}
				<div className="max-w-2xl flex flex-col items-center mb-7 animate-fade-in">
					<h1 className="text-3xl md:text-4xl font-bold text-amber-200 text-center mb-2 tracking-tight drop-shadow-lg">
						Discover, Listen & Share
					</h1>
					<p className="text-base md:text-lg text-amber-100 text-center mb-5 drop-shadow-md">
						Browse audio stories, music and podcasts.
						<br />
						Start by choosing a category or upload your own story!
					</p>
					{/* Stories page button */}
					<button
						className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xl shadow-lg flex items-center gap-2 border-2 border-amber-400 transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-amber-300"
						onClick={() => navigate("/stories")}
					>
						<span className="text-2xl">+</span>
						<span>Upload Your Audio</span>
					</button>
				</div>

				{/* Category Tabs */}
				<div className="flex items-center justify-center gap-3 mb-5 w-full max-w-lg">
					{FILTERS.map((filter) => (
						<button
							key={filter.id}
							className={`tab-btn drop-shadow-sm backdrop-blur transition-all duration-150 ${
								active === filter.id ? "active scale-105" : ""
							}`}
							onClick={() => setActive(filter.id)}
							style={
								active === filter.id
									? {
											background: "rgba(251, 191, 36, 0.90)", // amber-400 with transparency
											borderColor: "#f59e0b", // amber-500
											color: "#451a03", // amber-950 for contrast
											boxShadow:
												"0 0 16px 0 #f59e0b, 0 1.5px 7px 0 rgba(245,158,11,0.3)",
									  }
									: {
											background: "rgba(0, 0, 0, 0.6)",
											color: "#fbbf24", // amber-400
											borderColor: "rgba(251, 191, 36, 0.5)",
									  }
							}
						>
							<filter.icon size={18} className="inline mr-1" />
							{filter.label}
						</button>
					))}
				</div>

				{/* Search bar */}
				<div className="flex justify-center w-full mb-3">
					<input
						type="text"
						className="outline-none w-full max-w-[340px] mx-2 shadow text-base px-4 py-3 rounded-full border border-amber-500/50"
						placeholder="Search stories, music, podcasts..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						style={{
							background: "rgba(0, 0, 0, 0.8)",
							color: "#fbbf24", // amber-400
							backdropFilter: "blur(10px)",
						}}
					/>
				</div>
			</div>
		</section>
	);
}
