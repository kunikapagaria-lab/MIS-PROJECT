import { useState } from "react";
import { useParams } from "react-router";
import { Truck } from "lucide-react";
import { saveDeliveryFeedback } from "../data/store";

export function FeedbackPublic() {
  const { id = "" } = useParams();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const submitFeedback = () => {
    if (rating === 0) {
      alert("Please give 1-5 star rating.");
      return;
    }

    const ok = saveDeliveryFeedback(id, rating);
    if (!ok) {
      alert("Order not found for this feedback link.");
      return;
    }

    alert(`Thank you! You gave ${rating} star${rating > 1 ? "s" : ""}.`);
    setTimeout(() => window.history.back(), 800);
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-green-50 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-12 text-center">
        <div className="mb-10">
          <Truck className="text-green-600 mx-auto" size={144} />
        </div>

        <h1 className="text-5xl font-bold text-gray-800 mb-4">Material Received?</h1>
        <p className="text-2xl text-gray-700 mb-8">
          SO: <span className="text-orange-600 font-bold text-3xl">{id}</span>
        </p>

        <p className="text-3xl font-bold text-gray-800 mb-12">How was the delivery experience?</p>

        <div className="flex justify-center gap-6 mb-16">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="cursor-pointer transform transition hover:scale-125"
            >
              <span
                className={`text-8xl ${
                  star <= (hoveredRating || rating) ? "text-yellow-500" : "text-gray-300"
                }`}
              >
                ★
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={submitFeedback}
          className="px-20 py-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-3xl font-bold rounded-3xl shadow-2xl transform transition hover:scale-105"
        >
          Submit & Confirm Delivery
        </button>

        <p className="text-lg text-gray-600 mt-12">
          Powered by <span className="text-orange-600 font-bold">OrderTrail</span>
        </p>
      </div>
    </div>
  );
}

