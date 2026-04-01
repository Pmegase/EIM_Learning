export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  coverImage: string;
  publishedAt: string;
  scheduledAt?: string;
  tags: string[];
  category: string;
  status: "draft" | "published";
}

export const defaultPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Importance of Mentorship in Career Development",
    slug: "importance-of-mentorship-in-career-development",
    excerpt:
      "Mentorship plays a crucial role in shaping the careers of young professionals. Discover how a great mentor can accelerate your growth and open doors you never knew existed.",
    content: `Mentorship is one of the most powerful tools for professional development. A good mentor provides guidance, shares their experience, and helps mentees navigate the complexities of the professional world.

At EIM Consult, we understand the transformative power of mentorship. Our global mentorship program pairs young professionals with experienced industry leaders who provide personalized guidance and support.

**Why Mentorship Matters:**

1. **Knowledge Transfer** — Mentors share real-world insights that cannot be learned in a classroom. They provide practical advice based on years of experience.

2. **Networking Opportunities** — Through mentorship, mentees gain access to a wider professional network, opening doors to new opportunities and collaborations.

3. **Skill Development** — Mentors help identify skill gaps and guide mentees in developing competencies that are critical for career advancement.

4. **Confidence Building** — Having a trusted advisor boosts confidence and encourages mentees to take on new challenges and responsibilities.

5. **Career Navigation** — Mentors help mentees set realistic career goals and develop strategies to achieve them.

Our mentorship program runs twice a year and is completely free of charge. If you are interested in becoming a mentor or mentee, reach out to us at eimconsultld@gmail.com.`,
    author: "EIM Consult Team",
    coverImage: "/uploads/gallery-1.png",
    publishedAt: "2024-11-15",
    tags: ["Mentorship", "Career Development", "Professional Growth"],
    category: "Mentorship",
    status: "published",
  },
  {
    id: "2",
    title: "Building Employability Skills for the Modern Workplace",
    slug: "building-employability-skills-modern-workplace",
    excerpt:
      "In today's competitive job market, academic qualifications alone are not enough. Learn about the essential employability skills that every graduate needs.",
    content: `The modern workplace demands more than just academic knowledge. Employers are looking for candidates who possess a blend of technical skills, soft skills, and practical experience.

At EIM Learning and Development Consult, we focus on bridging the gap between education and employment by equipping students and graduates with the skills they need to succeed.

**Essential Employability Skills:**

1. **Communication Skills** — The ability to communicate effectively, both verbally and in writing, is fundamental in any professional setting.

2. **Personal Branding** — Understanding how to present yourself professionally, from your CV to your online presence, can set you apart from other candidates.

3. **Public Speaking** — Being able to confidently present ideas and information is a valuable skill in leadership and team environments.

4. **Digital Literacy** — Proficiency in basic tools like Excel, presentation software, and digital communication platforms is essential.

5. **Problem-Solving** — Employers value individuals who can think critically and develop creative solutions to challenges.

6. **Teamwork** — The ability to collaborate effectively with diverse teams is a must in today's interconnected workplace.

Our courses cover Personal Branding, Public Speaking, CV Writing, Opportunity Identification, Minute Writing, and Basic Excel Skills. Visit our services page to learn more.`,
    author: "Paulina Osei Megase",
    coverImage: "/uploads/team-member.png",
    publishedAt: "2024-12-01",
    tags: ["Employability", "Skills Development", "Education"],
    category: "Skills Development",
    status: "published",
  },
  {
    id: "3",
    title: "How Internships Shape Future Leaders",
    slug: "how-internships-shape-future-leaders",
    excerpt:
      "Internship programs are more than just work experience. They are the foundation for building the next generation of industry leaders in Africa.",
    content: `Internships provide a unique opportunity for students and young professionals to gain hands-on experience in a real-world work environment. At EIM Consult, our Student Internship Program is designed to do more than just fill positions — it is about developing future leaders.

**The EIM Internship Difference:**

Our program goes beyond traditional internships by incorporating:

1. **Global Mentorship** — Every intern is paired with a mentor from our global network who guides them throughout their internship journey.

2. **Out-of-Classroom Training** — We provide workshops and training sessions that complement the practical work experience.

3. **Corporate Exposure** — Interns work within partner organizations, gaining valuable insight into corporate culture and operations.

4. **Accountability Partnerships** — We create accountability structures that help interns track their progress and stay focused on their development goals.

**Impact on Partner Organizations:**

Organizations that participate in our program benefit from:
- Access to well-trained, motivated interns
- Fresh perspectives and innovative ideas
- Support from our mentorship network
- Contribution to youth development in Africa

If your organization is interested in partnering with EIM for our Student Internship Program, please download our program details from the Services section or contact us directly.`,
    author: "EIM Consult Team",
    coverImage: "/uploads/gallery-3.png",
    publishedAt: "2025-01-10",
    tags: ["Internships", "Leadership", "Youth Development"],
    category: "Internships",
    status: "published",
  },
];
