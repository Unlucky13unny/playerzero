interface PerformanceChartProps {
  viewMode: "public" | "private" | "team" | "own"
  userType: "trial" | "upgraded"
}

export function PerformanceChart({ viewMode, userType }: PerformanceChartProps) {
  return (
    <div 
      className="bg-white rounded-lg p-6"
      style={{
        /* Frame 458 container specifications */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0px 0px 10px',
        position: 'relative',
        width: '100%',
        maxWidth: '838px',
        height: '487px',
        background: 'rgba(0, 0, 0, 0.02)',
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
        borderRadius: '8px',
      }}
    >
      <div 
        style={{
          /* Group - Performance Overview Radar Chart positioning */
          position: 'absolute',
          left: '22.24%',
          right: '22.51%',
          top: '0%',
          bottom: '4.93%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <h3 className="text-lg font-bold text-center">Performance Overview</h3>
        <p className="text-sm text-gray-600 mt-2 text-center">
          {viewMode === "own" && userType === "trial" 
            ? "Upgrade to view detailed performance analytics" 
            : "Radar chart visualization will be displayed here"
          }
        </p>
      </div>
    </div>
  )
}