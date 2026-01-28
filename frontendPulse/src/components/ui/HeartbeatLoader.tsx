import { motion } from "framer-motion";


const HeartbeatLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-white">
      <svg
        width="200"
        height="100"
        viewBox="0 0 200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary stroke-current"
      >
        <motion.path
          d="M 0 50 L 30 50 L 45 50 L 55 20 L 65 80 L 75 50 L 90 50 L 100 20 L 110 80 L 120 50 L 200 50"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1], 
            opacity: [0, 1, 0],
            x: [0, 0, 50] // subtle forward movement
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.8, 1]
          }}
        />
      </svg>
    </div>
  );
};

export default HeartbeatLoader;
