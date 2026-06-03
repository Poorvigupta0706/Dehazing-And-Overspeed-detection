from deep_sort_realtime.deepsort_tracker import DeepSort

tracker = DeepSort(
    max_age=2,
    n_init=1
)

def track_objects(detections, frame):

    tracks = tracker.update_tracks(
        detections,
        frame=frame
    )

    tracked_objects = []

    for track in tracks:

        # Ignore unconfirmed tracks
        if not track.is_confirmed():
            continue

        # Unique vehicle ID
        track_id = track.track_id

        # Bounding box
        ltrb = track.to_ltrb()

        tracked_objects.append(
            (track_id, ltrb)
        )

    return tracked_objects