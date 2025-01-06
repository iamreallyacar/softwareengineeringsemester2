import statistics

data = [10, 20, 30, 40, 50]
std_dev = statistics.stdev(data)
print("Standard Deviation:", std_dev)
mean = statistics.mean(data)
print("Mean:", mean)

median = statistics.median(data)
print("Median:", median)

variance = statistics.variance(data)
print("Variance:", variance)

# Additional functions for energy usage data analysis
def calculate_min(data):
	return min(data)

def calculate_max(data):
	return max(data)

def calculate_range(data):
	return max(data) - min(data)

def calculate_sum(data):
	return sum(data)

# Examples
min_value = calculate_min(data)
print("Min:", min_value)

max_value = calculate_max(data)
print("Max:", max_value)

range_value = calculate_range(data)
print("Range:", range_value)

sum_value = calculate_sum(data)
print("Sum:", sum_value)