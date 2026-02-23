export default function Footer() {
    return (
        <footer className="w-full bg-white border-t border-gray-100 py-16 px-6 mt-16 relative z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex bg-gray-100 rounded-sm p-1 px-2 border border-gray-200">
                            <span className="text-google-blue font-[300]">K</span>
                            <span className="text-google-red font-[300]">i</span>
                            <span className="text-google-yellow font-[300]">r</span>
                            <span className="text-google-green font-[300]">a</span>
                        </div>
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
                <p>© 2026 Kira FlowState. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-gray-600">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-600">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
