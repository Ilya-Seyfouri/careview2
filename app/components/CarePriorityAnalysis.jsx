import { motion, AnimatePresence } from "framer-motion";
import { Activity, Sparkles, AlertCircle, ChevronDown } from "lucide-react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function CarePriorityAnalysis({
  analysisSectionOpen,
  setAnalysisSectionOpen,
  generatePriorityAnalysis,
  loadingAnalysis,
  error,
  priorityList,
  urgencyConfig,
  getInitials,
  setActiveModal,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="mb-10"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-6">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 rounded-full text-xs font-semibold mb-3 shadow-sm">
            <Sparkles size={14} />
            AI-Powered Assistant
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 mb-2">
            Patient Action Recommender
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Assessment of every patient with actionable recommendations
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Collapse/Expand Button */}
          <motion.button
            onClick={() => setAnalysisSectionOpen((prev) => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 cursor-pointer flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            aria-label={analysisSectionOpen ? "Collapse" : "Expand"}
          >
            <motion.div
              animate={{ rotate: analysisSectionOpen ? 0 : -180 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ChevronDown size={18} className="text-slate-600" />
            </motion.div>
          </motion.button>

          {/* Run Analysis Button */}
          <motion.button
            onClick={generatePriorityAnalysis}
            disabled={loadingAnalysis}
            whileHover={{ scale: loadingAnalysis ? 1 : 1.02 }}
            whileTap={{ scale: loadingAnalysis ? 1 : 0.98 }}
            className=" cursor-pointer bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl flex items-center gap-2.5 font-medium text-sm shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loadingAnalysis ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Activity size={18} />
                </motion.div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Run Analysis</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {analysisSectionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: -10, opacity: 0 }}
            transition={{
              height: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.25, delay: analysisSectionOpen ? 0.1 : 0 },
            }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              {/* Error Message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-5 flex items-start gap-4 mb-6 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle size={20} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 mb-1">
                        Analysis Error
                      </p>
                      <p className="text-sm text-red-700 leading-relaxed">
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {/* Loading State */}
                {loadingAnalysis && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                    >
                      <Activity size={32} className="text-white" />
                    </motion.div>
                    <p className="font-semibold text-lg text-slate-900 mb-2">
                      Analyzing patient data
                    </p>
                    <p className="text-sm text-slate-500 max-w-md text-center">
                      Reviewing vitals, visit logs, reports, and medications
                    </p>
                  </motion.div>
                )}

                {/* Empty State */}
                {!loadingAnalysis && priorityList.length === 0 && !error && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                      <Sparkles size={36} className="text-slate-300" />
                    </div>
                    <p className="font-semibold text-lg text-slate-900 mb-2">
                      No outstanding actions for this shift{" "}
                    </p>
                    <p className="text-sm text-slate-500">
                      Retry later by clicking "Run Analysis"
                    </p>
                  </motion.div>
                )}

                {/* Results Grid */}
                {!loadingAnalysis && priorityList.length > 0 && (
                  <motion.div
                    key="results"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {priorityList.map((patient) => {
                      const cfg =
                        urgencyConfig[patient.urgency] ||
                        urgencyConfig.THIS_WEEK;
                      if (!patient.actions || patient.actions.length === 0)
                        return null;
                      return (
                        <motion.div
                          key={patient.patient_id}
                          variants={itemVariants}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className={`bg-white rounded-2xl border ${cfg.border} shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col gap-5`}
                        >
                          {/* Patient Header */}
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-14 h-14 bg-gradient-to-br ${cfg.gradient} rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shrink-0`}
                            >
                              {getInitials(patient.patient_name)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h2 className="font-semibold text-slate-900 mb-2 truncate">
                                {patient.patient_name}
                              </h2>
                              <span
                                className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg ${cfg.badge}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                          </div>

                          {/* Actions Section */}
                          {(() => {
                            const ACTION_KEYS = [
                              "MAKE_SCHEDULE",
                              "MAKE_REPORT",
                              "REASSIGN_EMAR",
                              "REVIEW_EMAR_PLAN",
                              "CONTACT_FAMILY",
                              "URGENCY_LEVEL",
                            ];
                            const splitPattern = new RegExp(
                              `(?=${ACTION_KEYS.join("|")})`,
                            );
                            const segments = (patient.reasoning || "")
                              .split(splitPattern)
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((seg) => {
                                const dashIdx = seg.indexOf(" - ");
                                if (dashIdx !== -1)
                                  return {
                                    label: seg.substring(0, dashIdx).trim(),
                                    text: seg
                                      .substring(dashIdx + 3)
                                      .trim()
                                      .replace(/^—\s*/, ""),
                                  };
                                const spaceIdx = seg.indexOf(" ");
                                return {
                                  label: seg.substring(0, spaceIdx).trim(),
                                  text: seg
                                    .substring(spaceIdx + 1)
                                    .trim()
                                    .replace(/^—\s*/, ""),
                                };
                              });

                            const actions = segments.filter(
                              (s) => s.label !== "URGENCY_LEVEL",
                            );
                            const visibleActions = actions.filter((seg) =>
                              patient.actions.some((a) => a.type === seg.label),
                            );

                            return (
                              <div className="flex flex-col gap-3.5 pt-5 border-t border-slate-100">
                                {visibleActions.map((seg, i) => (
                                  <div key={i} className="space-y-2.5">
                                    <motion.button
                                      onClick={() =>
                                        setActiveModal({
                                          type: seg.label,
                                          patient,
                                        })
                                      }
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      className={`w-full cursor-pointer text-xs font-semibold px-4 py-2.5 rounded-lg bg-gradient-to-r ${cfg.gradient} text-white shadow-md hover:shadow-lg transition-all`}
                                    >
                                      {seg.label.replace(/_/g, " ")}
                                    </motion.button>
                                    <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                                      <p className="text-xs text-slate-700 leading-relaxed">
                                        {seg.text}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}