import { useState, useRef } from 'react';
import { PlusCircle, Upload, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminCreate = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let bannerUrl = null;

      // Upload banner image if selected
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-banners')
          .upload(fileName, bannerFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload banner image');
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('event-banners')
          .getPublicUrl(fileName);
        
        bannerUrl = urlData.publicUrl;
      }

      // Insert event into database
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          name: formData.name,
          start_date: formData.startDate,
          end_date: formData.endDate,
          description: formData.description,
          banner_image: bannerUrl,
          is_active: true,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to create event');
      }

      setIsComplete(true);
      toast({ title: 'Competition Created! 🎉', description: 'The new competition is now live.' });

      // Reset form
      setFormData({ name: '', startDate: '', endDate: '', description: '' });
      setBannerFile(null);
      setBannerPreview(null);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create competition',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground">Create Competition</h1>
      {isComplete ? (
        <div className="bg-card p-8 rounded-2xl border border-border/50 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 success-tick">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Competition Created!</h2>
          <p className="text-muted-foreground mb-4">Your new competition is now live and accepting registrations.</p>
          <Button variant="hero" onClick={() => setIsComplete(false)}>Create Another</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Competition Name</label>
            <Input 
              placeholder="e.g., Summer Championship 2025" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input 
                type="date" 
                required 
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input 
                type="date" 
                required 
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              placeholder="Competition details..." 
              rows={4} 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Banner Image</label>
            {bannerPreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={bannerPreview} alt="Banner preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeBanner}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <Button type="submit" variant="hero" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Create Competition
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default AdminCreate;