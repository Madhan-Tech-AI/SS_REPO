import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, User, FileText, ArrowRight, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Event {
  id: string;
  name: string;
  description: string | null;
}

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'Story Details', icon: FileText },
  { id: 3, title: 'Review & Submit', icon: Check },
];

const WEBHOOK_URL = 'https://kamalesh-tech-aiii.app.n8n.cloud/webhook/youtube-upload';

const Register = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isEventLocked, setIsEventLocked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    city: '',
  });
  const [storyDetails, setStoryDetails] = useState<{
    title: string;
    category: string;
    description: string;
    videoFile: File | null;
  }>({
    title: '',
    category: '',
    description: '',
    videoFile: null,
  });

  // Check for eventId in URL params
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      setSelectedEventId(eventId);
      setIsEventLocked(true);
    }
  }, [searchParams]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, description')
        .eq('is_active', true);
      
      if (!eventsError && eventsData) {
        setEvents(eventsData);
      }
    };
    fetchEvents();
  }, []);

  const validateStep1 = () => {
    const { firstName, lastName, email, phone, age, city } = personalInfo;
    if (!firstName || !lastName || !email || !phone || !age || !city) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all personal information fields before continuing.',
        variant: 'destructive',
      });
      return false;
    }
    // Validate phone number (should be exactly 10 digits after +91)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 12 || !phoneDigits.startsWith('91')) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid 10-digit phone number.',
        variant: 'destructive',
      });
      return false;
    }
    if (!selectedEventId) {
      toast({
        title: 'Event Required',
        description: 'Please select an event to participate in.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { title, category, description, videoFile } = storyDetails;
    if (!title || !category || !description || !videoFile) {
      toast({
        title: 'Missing story details',
        description: 'Please complete all story fields and upload a video before submitting.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const submitRegistration = async () => {
    if (!selectedEventId) {
      toast({
        title: 'Error',
        description: 'Please select an event.',
        variant: 'destructive',
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      // Generate a unique identifier for this registration (using email + phone)
      const registrationId = `${personalInfo.email}-${personalInfo.phone}`;

      // 1. Save registration to Supabase (user_id is null for non-authenticated users)
      const { error: dbError } = await supabase.from('registrations').insert({
        user_id: null,
        event_id: selectedEventId,
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        email: personalInfo.email,
        phone: `+91${personalInfo.phone.replace(/\D/g, '').slice(2)}`, // Ensure +91 prefix
        age: parseInt(personalInfo.age),
        city: personalInfo.city,
        story_title: storyDetails.title,
        category: storyDetails.category,
        story_description: storyDetails.description,
      });

      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: 'Registration Failed',
          description: 'Could not save registration. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      // Get event name for webhook
      const selectedEvent = events.find(e => e.id === selectedEventId);

      // 2. Send data + video to webhook
      const formData = new FormData();
      formData.append('registration_id', registrationId);
      formData.append('event_id', selectedEventId);
      formData.append('event_name', selectedEvent?.name || '');
      formData.append('first_name', personalInfo.firstName);
      formData.append('last_name', personalInfo.lastName);
      formData.append('email', personalInfo.email);
      formData.append('phone', `+91${personalInfo.phone.replace(/\D/g, '').slice(2)}`);
      formData.append('age', personalInfo.age);
      formData.append('city', personalInfo.city);
      formData.append('story_title', storyDetails.title);
      formData.append('category', storyDetails.category);
      formData.append('story_description', storyDetails.description);
      
      if (storyDetails.videoFile) {
        formData.append('video', storyDetails.videoFile);
      }

      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          body: formData,
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't fail the whole registration if webhook fails
      }

      return true;
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      const success = await submitRegistration();
      if (success) {
        setIsComplete(true);
        toast({
          title: 'Registration Successful! 🎉',
          description: 'Your story has been submitted successfully.',
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // If starts with 91, keep it, otherwise ensure it's just 10 digits
    if (digits.startsWith('91')) {
      // Allow +91 followed by up to 10 digits
      if (digits.length <= 12) {
        setPersonalInfo((prev) => ({ ...prev, phone: `+91${digits.slice(2)}` }));
      }
    } else {
      // Just 10 digits
      if (digits.length <= 10) {
        setPersonalInfo((prev) => ({ ...prev, phone: `+91${digits}` }));
      }
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-warm">
        <div className="max-w-md w-full mx-auto p-8 text-center animate-scale-in">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 success-tick">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Registration Complete!
          </h1>
          <p className="text-muted-foreground mb-8">
            Your registration has been submitted successfully. Check your email for confirmation
            and next steps.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link to="/dashboard" className="flex-1">
              <Button variant="hero" size="lg" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-warm page-enter">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join the <span className="text-gradient">Competition</span>
            </h1>
            <p className="text-muted-foreground">
              Complete your registration in 3 simple steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="relative mb-12">
            <div className="flex justify-between items-center">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div
                    className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                      currentStep > step.id
                        ? 'bg-green-500 text-primary-foreground'
                        : currentStep === step.id
                        ? 'bg-primary text-primary-foreground shadow-glow'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-sm font-medium',
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress Line */}
            <div className="absolute top-7 left-0 right-0 h-0.5 bg-muted -z-0">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Personal Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      placeholder="Enter first name"
                      value={personalInfo.firstName}
                      onChange={(e) =>
                        setPersonalInfo((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Enter last name"
                      value={personalInfo.lastName}
                      onChange={(e) =>
                        setPersonalInfo((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                      <span className="text-lg">🇮🇳</span>
                      <span className="text-sm font-medium text-muted-foreground">+91</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="98765 43210"
                      value={personalInfo.phone}
                      onChange={handlePhoneChange}
                      className="pl-20"
                      maxLength={13}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your 10-digit mobile number
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      placeholder="Enter age"
                      min={5}
                      max={18}
                      value={personalInfo.age}
                      onChange={(e) =>
                        setPersonalInfo((prev) => ({ ...prev, age: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="Your city"
                      value={personalInfo.city}
                      onChange={(e) =>
                        setPersonalInfo((prev) => ({ ...prev, city: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  {events.length === 0 ? (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-muted-foreground text-sm">
                        No events available at the moment.
                      </p>
                    </div>
                  ) : (
                    <Select 
                      value={selectedEventId} 
                      onValueChange={setSelectedEventId}
                      disabled={isEventLocked}
                    >
                      <SelectTrigger className="w-full">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Choose an event to participate" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {isEventLocked && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Event is pre-selected and cannot be changed.
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Story Details
                </h2>
                <div className="space-y-2">
                  <Label>Story Title</Label>
                  <Input
                    placeholder="Enter your story title"
                    value={storyDetails.title}
                    onChange={(e) =>
                      setStoryDetails((prev) => ({ ...prev, title: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground"
                    value={storyDetails.category}
                    onChange={(e) =>
                      setStoryDetails((prev) => ({ ...prev, category: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Family">Family</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Humor">Humor</option>
                    <option value="Mystery">Mystery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Story Description (Brief)</Label>
                  <textarea
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground resize-none"
                    rows={4}
                    placeholder="Tell us briefly what your story is about..."
                    value={storyDetails.description}
                    onChange={(e) =>
                      setStoryDetails((prev) => ({ ...prev, description: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Story Video (Required - Max 50MB)</Label>
                  <input
                    id="story-video-input"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        // Check file size (50MB = 50 * 1024 * 1024 bytes)
                        const maxSize = 50 * 1024 * 1024;
                        if (file.size > maxSize) {
                          toast({
                            title: 'File too large',
                            description: 'Video file must be less than 50MB. Please compress your video or choose a smaller file.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        setStoryDetails((prev) => ({ ...prev, videoFile: file }));
                      } else {
                        setStoryDetails((prev) => ({ ...prev, videoFile: null }));
                      }
                    }}
                  />
                  <label
                    htmlFor="story-video-input"
                    className={cn(
                      'flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                      storyDetails.videoFile
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-border bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    {storyDetails.videoFile ? (
                      <>
                        <Check className="w-8 h-8 text-green-600 mb-2" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {storyDetails.videoFile.name}
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          {(storyDetails.videoFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                        </span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload video
                        </span>
                        <span className="text-xs text-muted-foreground">MP4, MOV, AVI • Max 50MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Review & Submit
                </h2>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-xl">
                    <h3 className="font-medium text-foreground mb-2">Personal Info</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium text-foreground">Name:</span>{' '}
                        {personalInfo.firstName} {personalInfo.lastName}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Email:</span>{' '}
                        {personalInfo.email}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Phone:</span>{' '}
                        {personalInfo.phone}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Age:</span>{' '}
                        {personalInfo.age}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">City:</span>{' '}
                        {personalInfo.city}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Event:</span>{' '}
                        {events.find((e) => e.id === selectedEventId)?.name || 'Not selected'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl">
                    <h3 className="font-medium text-foreground mb-2">Story Details</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium text-foreground">Title:</span>{' '}
                        {storyDetails.title}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Category:</span>{' '}
                        {storyDetails.category}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Description:</span>{' '}
                        {storyDetails.description}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Video:</span>{' '}
                        {storyDetails.videoFile?.name || 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={cn(currentStep === 1 && 'invisible')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                type="button"
                variant="hero"
                onClick={handleNext}
                disabled={isSubmitting || (currentStep === 1 && events.length === 0)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Submit Registration
                    <Check className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
