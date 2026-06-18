"use client";

export default function Footer({
    hoverStyle = "tear",
    onHoverStyleChange
}: {
    hoverStyle?: "svgMask" | "tear" | "smooth" | "splatter" | "glitch";
    onHoverStyleChange?: (style: "svgMask" | "tear" | "smooth" | "splatter" | "glitch") => void;
}) {
    return (
        <footer className="w-full bg-white border-t border-gray-100 py-16 px-6 mt-16 relative z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <img src="/logo.png" alt="FlowState Logo" className="w-5 h-5 object-contain" />
                        <span className="text-gray-900 font-[300] text-xl">FlowState</span>
                    </div>
                    <p className="text-gray-500 max-w-sm">
                        The next generation architecture whiteboarding tool powered by the lowest-latency Gemini 2.0 Live system design models.
                    </p>
                </div>

                <div>
                    <h4 className="font-[300] text-gray-900 mb-4">Product</h4>
                    <ul className="space-y-3 text-gray-500">
                        <li><a href="#" className="hover:text-google-blue transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-google-blue transition-colors">Integrations</a></li>
                        <li><a href="#" className="hover:text-google-blue transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-google-blue transition-colors">Changelog</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-[300] text-gray-900 mb-4">Company</h4>
                    <ul className="space-y-3 text-gray-500">
                        <li><a href="#" className="hover:text-google-blue transition-colors">About</a></li>
                        <li><a href="#" className="hover:text-google-blue transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-google-blue transition-colors">Contact</a></li>
                        <li><a href="#" className="hover:text-google-blue transition-colors">Partners</a></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
                <div className="flex flex-col gap-1">
                    <p>© 2026 Genesis FlowState. All rights reserved.</p>
                    <p className="text-xs text-gray-400">A Genesis product · Developer Vishal V D</p>
                </div>
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="flex items-center gap-2">
                        <label htmlFor="hover-style" className="text-gray-500">Hover Style:</label>
                        <select
                            id="hover-style"
                            value={hoverStyle}
                            onChange={(e) => onHoverStyleChange?.(e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-google-blue focus:border-google-blue block px-2 py-1 outline-none cursor-pointer"
                        >
                            <option value="svgMask">Original Mask</option>
                            <option value="tear">Paper Tear</option>
                            <option value="smooth">Smooth Tear</option>
                            <option value="splatter">Splatter Tear</option>
                            <option value="glitch">Glitch Tear</option>
                        </select>
                    </div>
                    <a href="#" className="hover:text-gray-600">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-600">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
