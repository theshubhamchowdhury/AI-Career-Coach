"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

const courseContent = {
  1: {
    title: "Web Development Basics",
    videoUrl: "/videos/webdev.mp4",
    price: 499,
  },
  2: {
    title: "React for Beginners",
    videoUrl: "/videos/react.mp4",
    price: 699,
  },
  3: {
    title: "AI Career Guidance",
    videoUrl: "/videos/ai.mp4",
    price: 999,
  },
};

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isLoaded } = useUser();
  const course = courseContent[id];

  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [progress, setProgress] = useState(0);
  const [certificateReady, setCertificateReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const videoRef = useRef(null);
  const studentName = user?.fullName || "Student";
  const getUserId = () => (user?.id ? String(user.id) : null);

  // ✅ Check if user already purchased the course
  useEffect(() => {
    async function checkPayment() {
      if (!isLoaded || !user) return; // wait until Clerk loads

      try {
        console.log("🔍 Checking payment for:", {
          courseId: id,
          userId: user.id,
        });

        const res = await fetch(
          `/api/inngest/check-payment?courseId=${id}&userId=${user.id}`
        );
        const data = await res.json();

        console.log("✅ check-payment response:", data);

        if (data.ok && data.paid) {
          setPaid(true);
        } else {
          setPaid(false);
        }
      } catch (err) {
        console.error("❌ Check payment failed:", err);
        setPaid(false);
      } finally {
        setLoading(false);
      }
    }

    checkPayment();
  }, [id, user, isLoaded]);

  if (!course) return <p className="p-8">Course not found.</p>;

  const handleBuyCourse = async () => {
    try {
      const res = await fetch("/api/inngest/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: course.price,
          courseId: parseInt(id),
          courseTitle: course.title,
          userId: getUserId(),
        }),
      });

      const order = await res.json();
      if (!order.id) {
        alert("Error creating order");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "Tech Titans Academy",
        description: course.title,
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await fetch("/api/inngest/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: parseInt(id),
              userId: getUserId(),
            }),
          });

          const verifyData = await verifyRes.json();
          console.log("✅ verify-payment response:", verifyData);

          if (verifyData.ok) {
            setPaid(true);
            alert("✅ Payment successful!");
          } else {
            alert("❌ Payment verification failed. Refreshing...");
            setPaid(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed, please try again.");
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      const percent = Math.floor((video.currentTime / video.duration) * 100);
      setProgress(percent);
      if (percent >= 95) setCertificateReady(true);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setDownloading(true);
      const res = await fetch("/api/inngest/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: studentName, course: course.title }),
      });

      if (!res.ok) throw new Error("Failed to generate certificate");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${course.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Certificate generation failed:", error);
      alert("❌ Failed to generate certificate");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto pt-24 space-y-6 text-white">
      <h1 className="text-3xl font-bold mb-6">{course.title}</h1>

      {loading ? (
        <p className="text-gray-400">Checking payment status...</p>
      ) : paid ? (
        <div className="space-y-6">
          <video
            ref={videoRef}
            src={course.videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-[500px] rounded-xl shadow-md border border-gray-700"
          />

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleGenerateCertificate}
            disabled={!certificateReady || downloading}
            className={`px-6 py-3 rounded-lg font-semibold shadow-md transition ${
              certificateReady && !downloading
                ? "bg-violet-600 hover:bg-violet-700 text-white"
                : "bg-gray-500 text-gray-200 cursor-not-allowed"
            }`}
          >
            {downloading
              ? "Generating..."
              : certificateReady
              ? "Get Certificate"
              : "Complete the video to unlock certificate"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleBuyCourse}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-md"
        >
          Buy Course ₹{course.price}
        </button>
      )}
    </div>
  );
}
