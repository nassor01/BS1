import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import spfLogo from '../assets/sph-logo (1).png';

const Footer = () => {
    return (
        <footer className="bg-[#0B4F6C] text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <img 
                                src={spfLogo} 
                                alt="Swahilipot Hub" 
                                className="w-16 h-16 object-contain"
                            />
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">SWAHILIPOT</h2>
                                <p className="text-xs text-gray-300">Hub Foundation</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            Empowering youth through technology, arts, and entrepreneurship across East Africa.
                        </p>
                        <div className="flex space-x-4">
                            <a href="https://www.facebook.com/Swahilipothub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://x.com/swahilipothub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/swahilipothub/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://www.linkedin.com/company/swahilipot-hub/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="https://www.youtube.com/@swahilipothubfoundation" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Programs Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Programs</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    Mombasa Tourism Innovation Hub
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    Arts & Culture
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    Entrepreneurship
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    Youth Mentorship
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    Our Impact
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    Our Team
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-white transition-colors">
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact</h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Opp. Governor's Office, Butterfly House, Mombasa, Kenya</span>
                            </li>
                            <li>
                                <a href="mailto:info@swahilipothub.co.ke" className="flex items-center gap-2 hover:text-white transition-colors">
                                    <Mail className="w-4 h-4" />
                                    <span>info@swahilipothub.co.ke</span>
                                </a>
                            </li>
                            <li>
                                <a href="tel:+254114635505" className="flex items-center gap-2 hover:text-white transition-colors">
                                    <Phone className="w-4 h-4" />
                                    <span>+254 11 4635505</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-8 border-t border-gray-600 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-300">
                    <p>© 2026 Swahilipot Hub Foundation. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 sm:mt-0">
                        <a href="#" className="hover:text-white transition-colors">
                            Terms of Service
                        </a>
                        <a href="#" className="hover:text-white transition-colors">
                            Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
