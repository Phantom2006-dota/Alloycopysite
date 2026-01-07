import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Globe, Award, CheckCircle2 } from "lucide-react";

const Training = () => {
  const courses = [
    {
      title: "Film & Television Production",
      description: "Comprehensive training in screenwriting, cinematography, editing, and production management.",
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      features: ["Hands-on workshops", "Industry-standard equipment", "Professional mentorship"]
    },
    {
      title: "Creative Writing & Publishing",
      description: "Master the art of storytelling and learn the intricacies of the modern publishing industry.",
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      features: ["Narrative structure", "Editorial processes", "Self-publishing guides"]
    },
    {
      title: "Cultural Tourism Management",
      description: "Specialized training for professionals in the travel and tourism sector focusing on heritage sites.",
      icon: <Globe className="h-8 w-8 text-primary" />,
      features: ["Heritage preservation", "Sustainable tourism", "Destination marketing"]
    }
  ];

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <h1 className="section-title text-center mb-16 animate-fade-in">BAUHAUS TRAINING</h1>

        <section className="text-center animate-slide-up mb-20">
          <p className="text-xl md:text-2xl leading-relaxed font-serif text-foreground/90 mb-8">
            Empowering the next generation of African creatives through world-class professional training.
          </p>
          <p className="body-text text-center max-w-3xl mx-auto">
            Bauhaus Education is dedicated to providing accredited professional training, global partnerships, and digital education innovation. We champion excellence in business, computing, and professional studies across our centers.
          </p>
        </section>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {courses.map((course, index) => (
            <Card key={index} className="card-hover border-border overflow-hidden">
              <CardContent className="p-8">
                <div className="mb-6">{course.icon}</div>
                <h3 className="text-xl font-serif mb-4">{course.title}</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {course.description}
                </p>
                <ul className="space-y-3">
                  {course.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="bg-muted/50 rounded-2xl p-8 md:p-12 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-serif mb-6">Why Train with Bauhaus?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-background p-3 rounded-lg shadow-sm h-fit">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Expert Instructors</h4>
                    <p className="text-sm text-muted-foreground">Learn from industry veterans with decades of experience in their respective fields.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-background p-3 rounded-lg shadow-sm h-fit">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Accredited Programs</h4>
                    <p className="text-sm text-muted-foreground">Our certifications are recognized globally, opening doors to international opportunities.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-serif mb-4">Ready to start your journey?</h3>
              <p className="text-muted-foreground mb-8">
                Join hundreds of students who have transformed their careers through our specialized training programs.
              </p>
              <a
                href="mailto:training@bauhaus.ng"
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                Inquire About Courses
              </a>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Training;


