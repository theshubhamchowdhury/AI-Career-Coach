"use client";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // install Clerk package if you use it

const courses = [
  { id: 1, title: "Web Development Basics", description: "Learn HTML, CSS, JS.", image: "/courses/webdev.jpg", price: 499 },
  { id: 2, title: "React for Beginners", description: "Build interactive UIs.", image: "/courses/react.jpg", price: 699 },
  { id: 3, title: "AI Career Guidance", description: "Explore AI & ML careers.", image: "/courses/ai.jpg", price: 999 },
];

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useUser ? useUser() : { user: null }; // if Clerk present

  const getUserId = () => {
    // Prefer actual logged-in user id (string). Fallback to "1" for local test.
    return user?.id ? String(user.id) : "1";
  };

  const handleBuyCourse = async (course) => {
    try {
      const res = await fetch("/api/inngest/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: course.price,
          courseId: course.id,
          courseTitle: course.title,
          userId: getUserId(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount ?? data.amount, // use amount returned
        currency: data.currency ?? "INR",
        name: "Tech Titans",
        description: course.title,
        order_id: data.id ?? data.id,
        handler: async function (response) {
          // include userId so verify-payment can find the user
          const verifyRes = await fetch("/api/inngest/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course.id,
              userId: getUserId(),
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.ok) {
            alert("✅ Payment successful!");
            router.push(`/courses/${course.id}/content`);
          } else {
            alert("❌ Payment verification failed: " + (verifyData.error || ""));
          }
        },
        prefill: { name: user?.fullName ?? "Demo User", email: user?.primaryEmailAddress?.emailAddress ?? "demo@example.com", contact: "9999999999" },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed, please try again.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 pt-24">
      {courses.map((course) => (
        <div key={course.id} className="bg-gray-800 text-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
          <div className="w-full h-40 overflow-hidden rounded-lg mb-4">
            <img src={course.image} alt={course.title} className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105" />
          </div>
          <h2 className="text-xl font-bold mb-2">{course.title}</h2>
          <p className="text-gray-300 mb-2">{course.description}</p>
          <p className="text-white-400 font-bold mb-4">₹{course.price}</p>
          <button onClick={() => handleBuyCourse(course)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Buy Course
          </button>
        </div>
      ))}
    </div>
  );
}
