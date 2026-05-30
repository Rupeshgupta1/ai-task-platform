import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
import redis
from pymongo import MongoClient
from bson.objectid import ObjectId

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
QUEUE_KEY = "task-queue-python"
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/ai-task-platform")

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database()
tasks_collection = db["tasks"]

logger.info("Connected to Redis and MongoDB")


def process_operation(operation, text):
    if operation == "uppercase":
        return text.upper()
    elif operation == "lowercase":
        return text.lower()
    elif operation == "reverse":
        return text[::-1]
    elif operation == "word_count":
        return len(text.strip().split())
    else:
        raise ValueError(f"Unknown operation: {operation}")


def add_log(task_id, level, message):
    """Push a log entry to the task."""
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$push": {
                "logs": {
                    "level": level,
                    "message": message,
                    "timestamp": datetime.utcnow()
                }
            }
        }
    )


def update_task(task_id, update_data):
    """Apply $set fields to a task."""
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )


def process_job(job_data):
    task_id = job_data["taskId"]
    operation = job_data["operation"]
    input_text = job_data["inputText"]

    # Set status to 'running' + log
    update_task(task_id, {
        "status": "running",
        "startedAt": datetime.utcnow()
    })
    add_log(task_id, "info", "Task processing started (Python worker).")

    try:
        result = process_operation(operation, input_text)

        # Success
        update_task(task_id, {
            "status": "success",
            "result": result,
            "completedAt": datetime.utcnow()
        })
        add_log(task_id, "info", "Task completed successfully.")
        logger.info(f"Task {task_id} completed. Result: {result}")

    except Exception as e:
        # Failure
        update_task(task_id, {"status": "failed"})
        add_log(task_id, "error", str(e))
        logger.error(f"Task {task_id} failed: {str(e)}")


def main():
    logger.info("Python worker started, waiting for jobs...")
    import time
    while True:
        try:
            result = redis_client.brpop(QUEUE_KEY, timeout=5)
            if result is None:
                continue
            _, job_json = result
            job_data = json.loads(job_json)
            process_job(job_data)
        except KeyboardInterrupt:
            logger.info("Worker shut down gracefully.")
            break
        except Exception as e:
            logger.error(f"Error: {e}")
            time.sleep(1)


if __name__ == "__main__":
    main()