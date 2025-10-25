import React, { useState } from 'react';
import { MapPin, Mail, Instagram, Facebook } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import sendEmail from '@/services/sendEmail';

const Contact = () => {
  const { content } = useContent();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendEmail(formData);
      toast({
        title: "Message sent! 👍",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      // Reset form on successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Email sending error:', error);

      // More specific error messages
      let errorMessage = "There was a problem sending your message. Please try again.";

      if (error.message?.includes('Network error') || error.message?.includes('Failed to fetch')) {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else if (error.message?.includes('500') || error.message?.includes('server')) {
        errorMessage = "Server error: Please try again in a few moments.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Uh oh! Something went wrong.",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Check if form is valid (all fields filled)
  const isFormValid = formData.firstName && formData.lastName &&
    formData.email && formData.subject && formData.message;

  return (
    <section
      id="contact"
      className="py-20 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url('/lovable-uploads/f448dfc5-c8f8-41cf-a5a2-cd29fa41ac04.png')`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Contact us</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Have questions or want to learn more about our programs? Get in touch with us today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Input
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Input
                  name="subject"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Textarea
                  name="message"
                  placeholder="Your message..."
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 transition-colors"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Address</h4>
                  <p className="text-gray-600">{content.contactInfo.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Email</h4>
                  <a
                    href={`mailto:${content.contactInfo.email}`}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    {content.contactInfo.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Instagram className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Instagram</h4>
                  <a
                    href={`https://www.instagram.com/${content.contactInfo.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    {content.contactInfo.instagram}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Facebook className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Facebook</h4>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    {content.contactInfo.facebook}
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-bold text-gray-800 mb-2">Response Time</h4>
              <p className="text-gray-600 text-sm">
                We typically respond to all inquiries within 24-48 hours during business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;