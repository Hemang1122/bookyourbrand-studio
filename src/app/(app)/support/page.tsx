
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Building } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Contact Support</h2>
                <p className="text-muted-foreground">
                    Get in touch with us for any questions or issues.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                        You can reach us via the following channels. We're available during business hours.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="flex items-start gap-4">
                        <Mail className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Email</h3>
                            <p className="text-muted-foreground">For general inquiries and support.</p>
                            <a href="mailto:support@bookyourbrands.com" className="text-primary font-medium">
                                support@bookyourbrands.com
                            </a>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Phone className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Phone</h3>
                            <p className="text-muted-foreground">For urgent matters.</p>
                            <a href="tel:+918433943520" className="text-primary font-medium">
                                +91 84339 43520
                            </a>
                        </div>
                    </div>
                     <div className="flex items-start gap-4 md:col-span-2">
                        <Building className="h-8 w-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Office Address</h3>
                            <p className="text-muted-foreground">
                                Shop No 14, Vishwakarma Nagar building. 03, 60 feet road,
                                <br />
                                Landmark: opposite old swaminarayan temple,
                                <br />
                                Vasai West, Vasai-Virar, Maharashtra 401202
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
