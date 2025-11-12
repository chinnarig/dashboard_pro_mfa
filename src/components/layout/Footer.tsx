import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t mt-auto">
            <div className="container px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Zlavox AI</h3>
                        <p className="text-sm text-muted-foreground">
                            A modern blogging platform for writers and readers.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                                    Articles
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                                    About
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold">Connect</h4>
                        <div className="flex gap-4">
                            <a href="#" className="text-muted-foreground hover:text-foreground">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-foreground">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Zlavox AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}