import React from 'react';
import Header from '@/components/Header';
import Footer from  '@/components/Footer';

const FAQ = () => {
    const faqData = [
        {
            question: "Who does EIM Consultancy work with?",
            answer: "EIM works with corporate institutions looking for qualified interns and junior-level staff and students, young professionals, and recent graduates in need of career guidance and employability skills training."
        },
        {
            question: "How often do you organize the Mentorship Program?",
            answer: "Currently, the Mentorship Program is held twice a year."
        },
        {
            question: "Who can attend our training & mentorship programs?",
            answer: "Our workshops & programs are held mainly for students, graduates, and young professionals."
        },
        {
            question: "How does EIM ensure its programs are tailored to meet the needs of a modern-day student?",
            answer: "With first-hand experience of the difficulty students face transitioning into the corporate/business world after school, we have researched and identified the right training & guidance programs that we believe will be useful to students once they get into the office."
        },
        {
            question: "Why should a client choose EIM as a partner to help develop their corporate skill?",
            answer: "We provide a platform that facilitates youth leadership and unleashes the potential of the Ghanaian youth using accountability networking, self-development workshops, and global mentorship programs."
        },
        {
            question: "What are the benefits of learning & development to a student or graduate in the modern workplace?",
            answer: "Personal and career development helps you develop new skills and build on old ones, no matter your level of experience. It also gives you an added advantage over other job seekers since every employer today is only looking to hire qualified and experienced personnel."
        },
        {
            question: "How can I sign up with EIM?",
            answer: "Please send us an email via eimconsultld@gmail.com stating which of our programs you want to sign up for."
        },
        {
            question: "How many weeks will the mentorship program take?",
            answer: "The Mentorship Program is for six (6) weeks."
        },
        {
            question: "How much does the Mentorship Program cost?",
            answer: "The program is not paid for it is done for free."
        },
        {
            question: "What role does a Learning & Development consultancy like EIM play in today's workplace?",
            answer: "Our main goal is to help employees align their goals & performance with that of the company to promote overall business productivity."
        }
    ];

    return (
        <div className="min-h-screen">
            <Header />

            <section className="py-20 bg-gray-50 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-4xl font-bold mb-12 text-center text-gray-800 border-b-4 border-green-500 pb-4 inline-block">
                        FREQUENTLY ASKED QUESTIONS
                    </h2>

                    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
                        {faqData.map((item, index) => (
                            <div
                                key={index}
                                className="mb-8 last:mb-0 pb-6 last:pb-0 border-b last:border-b-0 border-gray-200"
                            >
                                <p className="font-semibold text-lg text-gray-800 mb-2">
                                    {item.question}
                                </p>
                                <p className="text-gray-600">
                                    {item.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default FAQ;