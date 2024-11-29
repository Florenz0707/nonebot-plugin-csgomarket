from .items import item_names

goods = list(item_names.keys())

def exact_match(keyword):
    lower_case_keywords = keyword.lower().split()
    return [item for item in goods if all(kw in item.lower() for kw in lower_case_keywords)]

def jaro(s1, s2):
    s1, s2 = s1.lower(), s2.lower()
    s1_len, s2_len = len(s1), len(s2)
    if s1_len == 0 and s2_len == 0:
        return 1.0
    if s1_len == 0 or s2_len == 0:
        return 0.0

    match_distance = max(s1_len, s2_len) // 2 - 1
    s1_matches = [False] * s1_len
    s2_matches = [False] * s2_len
    matches = 0
    transpositions = 0

    for i in range(s1_len):
        start, end = max(0, i - match_distance), min(i + match_distance + 1, s2_len)
        for j in range(start, end):
            if s2_matches[j]:
                continue
            if s1[i] == s2[j]:
                s1_matches[i] = s2_matches[j] = True
                matches += 1
                break

    if matches == 0:
        return 0.0

    k = 0
    for i in range(s1_len):
        if s1_matches[i]:
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1

    transpositions /= 2
    return (matches / s1_len + matches / s2_len + (matches - transpositions) / matches) / 3.0

def jaro_match(keyword, threshold=0.7):
    return sorted(
        [item for item in goods if jaro(item, keyword) > threshold],
        key=lambda item: jaro(item, keyword),
        reverse=True
    )

def fetch_by_name(query):
    query = query.strip()
    if not query:
        return []

    exact_results = exact_match(query)
    if exact_results:
        return exact_results

    fuzzy_results = jaro_match(query)
    return fuzzy_results

