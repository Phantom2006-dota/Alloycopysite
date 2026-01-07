import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { User, Mail, Linkedin, Twitter } from "lucide-react";
import { useState, useEffect } from "react";
import { mockTeamMembers } from "@/lib/mockTeamData";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  profilePhoto: string | null;
  socialLinks: string | null;
  isActive: boolean;
}

const Team = () => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    try {
      if (!Layout) {
        throw new Error("Layout component not found");
      }
    } catch (error) {
      console.error("Component initialization error:", error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : "Component error");
    }
  }, []);

  const { data: teamData, isLoading, error: teamError } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      try {
        const data = await api.team.list();
        // If API returns empty or fails, use mock data
        if (!data || data.length === 0) {
          return mockTeamMembers;
        }
        return data;
      } catch (error) {
        console.error("Error fetching team members, using mock data:", error);
        return mockTeamMembers;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    if (teamError) {
      console.error("Query error detected:", teamError);
      // Don't set error state if we have mock data fallback
    }
  }, [teamError]);

  const teamMembers: TeamMember[] = teamData || mockTeamMembers;

  const getSocialLinks = (socialLinksString: string | null) => {
    if (!socialLinksString) return {};
    try {
      const links = JSON.parse(socialLinksString);
      return links || {};
    } catch {
      return {};
    }
  };

  const departments = teamMembers.reduce((acc, member) => {
    if (member.department && !acc.includes(member.department)) {
      acc.push(member.department);
    }
    return acc;
  }, [] as string[]);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Team...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <h1 className="section-title text-center mb-16 animate-fade-in">OUR TEAM</h1>

        <section className="text-center animate-slide-up">
          <p className="text-xl md:text-2xl leading-relaxed font-serif text-foreground/90 mb-8">
            BAUHAUS is led by a passionate team dedicated to celebrating Nigerian culture through books, films, and travel experiences.
          </p>
          
          <p className="body-text text-center max-w-2xl mx-auto mb-12">
            Our team brings together expertise in publishing, film production, and tourism to create meaningful connections between Nigerian stories and global audiences. We're committed to excellence in everything we do.
          </p>
        </section>

        {teamMembers.length > 0 ? (
          <>
            {/* Filter by Department */}
            {departments.length > 1 && (
              <div className="mb-12">
                <h2 className="text-lg font-serif text-center mb-6">Departments</h2>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm">
                    All
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      className="px-4 py-2 bg-muted rounded-full text-sm hover:bg-muted/80 transition-colors"
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers
                .filter(member => member.isActive)
                .map((member) => {
                  const socialLinks = getSocialLinks(member.socialLinks);
                  
                  return (
                    <Card key={member.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                      <div className="p-6">
                        <div className="flex flex-col items-center text-center">
                          {/* Profile Photo */}
                          <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-background shadow-lg">
                            {member.profilePhoto ? (
                              <img
                                src={member.profilePhoto}
                                alt={member.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <User className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          {/* Member Info */}
                          <h3 className="text-xl font-serif font-medium mb-2">{member.name}</h3>
                          <p className="text-sm font-medium text-primary mb-1">{member.role}</p>
                          {member.department && (
                            <p className="text-xs text-muted-foreground mb-4">{member.department}</p>
                          )}

                          {/* Bio */}
                          {member.bio && (
                            <p className="text-sm text-foreground/80 mb-6">
                              {member.bio}
                            </p>
                          )}

                          {/* Social Links */}
                          {(socialLinks.linkedin || socialLinks.twitter || socialLinks.email) && (
                            <div className="flex gap-3">
                              {socialLinks.linkedin && (
                                <a
                                  href={socialLinks.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-muted rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                  aria-label={`${member.name}'s LinkedIn`}
                                >
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              )}
                              {socialLinks.twitter && (
                                <a
                                  href={socialLinks.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-muted rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                  aria-label={`${member.name}'s Twitter`}
                                >
                                  <Twitter className="h-4 w-4" />
                                </a>
                              )}
                              {socialLinks.email && (
                                <a
                                  href={`mailto:${socialLinks.email}`}
                                  className="p-2 bg-muted rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                                  aria-label={`Email ${member.name}`}
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </>
        ) : (
          <section className="animate-slide-up text-center" style={{ animationDelay: "0.2s" }}>
            <div className="py-12">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                <User className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-serif mb-3">Team Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're currently building our team profiles. Check back soon to meet the people behind BAUHAUS!
              </p>
            </div>
          </section>
        )}

        <div className="divider my-16" />

        {/* Join Our Team CTA */}
        <section className="text-center animate-fade-in">
          <h2 className="text-xl font-serif mb-6">Join Our Team</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Passionate about Nigerian culture, storytelling, or tourism? We're always looking for talented individuals to join our mission.
          </p>
          <a
            href="mailto:careers@bauhaus.ng"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contact Careers
          </a>
        </section>
      </div>
    </Layout>
  );
};

export default Team;
